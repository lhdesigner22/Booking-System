import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/adminAuth.js';

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────

/** Quantidade de unidades atualmente reservadas (aprovadas) para um equipamento */
async function qtdEmUso(client, equipamento_id) {
  const r = await client.query(
    `SELECT COALESCE(SUM(quantidade), 0) AS total
     FROM reservas
     WHERE equipamento_id = $1
       AND status = 'aprovada'`,
    [equipamento_id]
  );
  return parseInt(r.rows[0].total, 10);
}

// ── rotas ────────────────────────────────────────────────────────────────────

// GET /api/equipamentos — lista todos (usuário autenticado)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
             GREATEST(e.quantidade_total - COALESCE(em_uso.total, 0), 0)::INTEGER AS quantidade_disponivel,
             COALESCE(pat.total, 0)::INTEGER AS total_patrimonios
      FROM equipamentos e
      LEFT JOIN (
        SELECT equipamento_id, SUM(quantidade)::INTEGER AS total
        FROM reservas
        WHERE status = 'aprovada'
        GROUP BY equipamento_id
      ) em_uso ON em_uso.equipamento_id = e.id
      LEFT JOIN (
        SELECT equipamento_id, COUNT(*)::INTEGER AS total
        FROM patrimonios
        GROUP BY equipamento_id
      ) pat ON pat.equipamento_id = e.id
      ORDER BY e.nome
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/equipamentos/estoque — resumo de estoque (só admin)
router.get('/estoque', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
             COALESCE(em_uso.total, 0)::INTEGER                               AS quantidade_em_uso,
             GREATEST(e.quantidade_total - COALESCE(em_uso.total, 0), 0)::INTEGER AS quantidade_disponivel
      FROM equipamentos e
      LEFT JOIN (
        SELECT equipamento_id, SUM(quantidade)::INTEGER AS total
        FROM reservas
        WHERE status = 'aprovada'
        GROUP BY equipamento_id
      ) em_uso ON em_uso.equipamento_id = e.id
      ORDER BY e.categoria NULLS LAST, e.nome
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/equipamentos/:id — busca um
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
             GREATEST(e.quantidade_total - COALESCE(em_uso.total, 0), 0)::INTEGER AS quantidade_disponivel
      FROM equipamentos e
      LEFT JOIN (
        SELECT equipamento_id, SUM(quantidade)::INTEGER AS total
        FROM reservas
        WHERE status = 'aprovada'
        GROUP BY equipamento_id
      ) em_uso ON em_uso.equipamento_id = e.id
      WHERE e.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Equipamento não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/equipamentos/:id/disponibilidade?data_inicio=...&data_fim=...
router.get('/:id/disponibilidade', authMiddleware, async (req, res) => {
  const { data_inicio, data_fim } = req.query;
  if (!data_inicio || !data_fim)
    return res.status(400).json({ error: 'Informe data_inicio e data_fim' });

  try {
    const equip = await pool.query(
      'SELECT quantidade_total FROM equipamentos WHERE id = $1',
      [req.params.id]
    );
    if (equip.rows.length === 0)
      return res.status(404).json({ error: 'Equipamento não encontrado' });

    const { quantidade_total } = equip.rows[0];

    const conflito = await pool.query(
      `SELECT COALESCE(SUM(quantidade), 0) AS total
       FROM reservas
       WHERE equipamento_id = $1
         AND status NOT IN ('cancelada', 'recusada')
         AND (data_inicio, data_fim) OVERLAPS ($2::timestamp, $3::timestamp)`,
      [req.params.id, data_inicio, data_fim]
    );

    const emUso = parseInt(conflito.rows[0].total, 10);
    const disponivel = emUso < quantidade_total;

    res.json({ disponivel, quantidade_total, em_uso: emUso, disponivel_count: Math.max(quantidade_total - emUso, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/equipamentos/:id/calendario?ano=2025&mes=5
router.get('/:id/calendario', authMiddleware, async (req, res) => {
  const { ano, mes } = req.query;
  if (!ano || !mes) return res.status(400).json({ error: 'Informe ano e mes' });

  try {
    const result = await pool.query(
      `SELECT data_inicio, data_fim, status
       FROM reservas
       WHERE equipamento_id = $1
         AND status NOT IN ('cancelada', 'recusada')
         AND data_inicio < (DATE_TRUNC('month', MAKE_DATE($2::int, $3::int, 1)) + INTERVAL '1 month')
         AND data_fim    > DATE_TRUNC('month', MAKE_DATE($2::int, $3::int, 1))`,
      [req.params.id, parseInt(ano), parseInt(mes)]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/equipamentos — cadastrar (admin)
router.post('/', adminMiddleware, async (req, res) => {
  const { nome, descricao, quantidade_total = 1, numero_serie, categoria } = req.body;

  if (!nome)
    return res.status(400).json({ error: 'Nome é obrigatório' });

  if (quantidade_total < 1)
    return res.status(400).json({ error: 'Quantidade total deve ser ao menos 1' });

  try {
    const result = await pool.query(
      `INSERT INTO equipamentos (nome, descricao, disponivel, quantidade_total, numero_serie, categoria)
       VALUES ($1, $2, true, $3, $4, $5)
       RETURNING *`,
      [nome, descricao || null, quantidade_total, numero_serie || null, categoria || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/equipamentos/:id — editar (admin)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { nome, descricao, disponivel, quantidade_total, numero_serie, categoria } = req.body;

  // Valida que nova quantidade não seja menor que unidades já em uso
  if (quantidade_total !== undefined) {
    const client = await pool.connect();
    try {
      const emUso = await qtdEmUso(client, req.params.id);
      if (quantidade_total < emUso) {
        return res.status(400).json({
          error: `Não é possível reduzir para ${quantidade_total}. Há ${emUso} unidade(s) atualmente em uso.`,
        });
      }
    } finally {
      client.release();
    }
  }

  try {
    const result = await pool.query(
      `UPDATE equipamentos
       SET nome             = COALESCE($1, nome),
           descricao        = COALESCE($2, descricao),
           disponivel       = COALESCE($3, disponivel),
           quantidade_total = COALESCE($4, quantidade_total),
           numero_serie     = COALESCE($5, numero_serie),
           categoria        = COALESCE($6, categoria)
       WHERE id = $7
       RETURNING *`,
      [nome, descricao, disponivel, quantidade_total, numero_serie, categoria, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Equipamento não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/equipamentos/:id — remover (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM equipamentos WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Equipamento não encontrado' });

    res.json({ mensagem: 'Equipamento removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;