import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reservas — criar reserva
router.post('/', authMiddleware, async (req, res) => {
  const { data_inicio, data_fim, local_uso } = req.body;
  const equipamento_id = parseInt(req.body.equipamento_id, 10);
  const quantidade = parseInt(req.body.quantidade, 10) || 1;

  if (!equipamento_id || isNaN(equipamento_id) || !data_inicio || !data_fim)
    return res.status(400).json({ error: 'equipamento_id, data_inicio e data_fim são obrigatórios' });

  if (quantidade < 1 || isNaN(quantidade))
    return res.status(400).json({ error: 'quantidade deve ser um número inteiro maior que zero' });

  if (quantidade > 10)
    return res.status(400).json({ error: 'Quantidade máxima por reserva é 10 unidades do mesmo item' });

  if (new Date(data_inicio) >= new Date(data_fim))
    return res.status(400).json({ error: 'data_inicio deve ser anterior à data_fim' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verifica se equipamento existe e está habilitado
    const equip = await client.query(
      'SELECT * FROM equipamentos WHERE id = $1',
      [equipamento_id]
    );
    if (equip.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    if (!equip.rows[0].disponivel) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Equipamento indisponível' });
    }

    const { quantidade_total } = equip.rows[0];

    // Soma as quantidades já reservadas no período solicitado
    const conflito = await client.query(
      `SELECT COALESCE(SUM(quantidade), 0) AS total
       FROM reservas
       WHERE equipamento_id = $1
         AND status NOT IN ('cancelada', 'recusada')
         AND (data_inicio, data_fim) OVERLAPS ($2::timestamp, $3::timestamp)`,
      [equipamento_id, data_inicio, data_fim]
    );

    const emUso = parseInt(conflito.rows[0].total, 10);
    const disponivel = quantidade_total - emUso;

    // Bloqueia se não há unidades suficientes no período
    if (quantidade > disponivel) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Estoque insuficiente nesse período. Disponível: ${disponivel} de ${quantidade_total} unidade(s).`,
      });
    }

    // Cria a reserva
    const result = await client.query(
      `INSERT INTO reservas (usuario_id, equipamento_id, data_inicio, data_fim, quantidade, local_uso, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendente')
       RETURNING *`,
      [req.userId, equipamento_id, data_inicio, data_fim, quantidade, local_uso || null]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/reservas — listar (usuário vê só as suas)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              u.nome AS usuario_nome,
              e.nome AS equipamento_nome,
              e.categoria AS equipamento_categoria
       FROM reservas r
       JOIN usuarios u ON r.usuario_id = u.id
       JOIN equipamentos e ON r.equipamento_id = e.id
       WHERE r.usuario_id = $1
       ORDER BY r.data_inicio DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reservas/:id — buscar uma reserva
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              u.nome AS usuario_nome,
              e.nome AS equipamento_nome,
              e.categoria AS equipamento_categoria
       FROM reservas r
       JOIN usuarios u ON r.usuario_id = u.id
       JOIN equipamentos e ON r.equipamento_id = e.id
       WHERE r.id = $1 AND r.usuario_id = $2`,
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Reserva não encontrada' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reservas/:id/status — usuário só pode cancelar a própria reserva
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;

  if (status !== 'cancelada')
    return res.status(403).json({ error: 'Usuários só podem cancelar reservas. Use o painel admin para aprovar ou recusar.' });

  try {
    const result = await pool.query(
      `UPDATE reservas SET status = $1
       WHERE id = $2 AND usuario_id = $3 AND status = 'pendente'
       RETURNING *`,
      [status, req.params.id, req.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Reserva não encontrada ou não está pendente' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;