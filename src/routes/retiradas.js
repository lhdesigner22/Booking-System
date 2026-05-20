import express from 'express';
import { pool } from '../config/database.js';
import { adminMiddleware } from '../middleware/adminAuth.js';

const router = express.Router();

// ── POST /api/retiradas ───────────────────────────────────────────────────────
// Registra uma retirada de item do estoque (somente admin)
router.post('/', adminMiddleware, async (req, res) => {
  const {
    colaborador_nome,
    colaborador_email,
    local_setor,
    equipamento_id,
    quantidade,
    observacoes,
  } = req.body;

  if (!colaborador_nome?.trim())
    return res.status(400).json({ error: 'Nome do colaborador é obrigatório' });
  if (!colaborador_email?.trim())
    return res.status(400).json({ error: 'E-mail do colaborador é obrigatório' });
  if (!local_setor?.trim())
    return res.status(400).json({ error: 'Local/Setor é obrigatório' });
  if (!equipamento_id)
    return res.status(400).json({ error: 'Selecione um equipamento' });
  if (!quantidade || quantidade < 1)
    return res.status(400).json({ error: 'Quantidade deve ser ao menos 1' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Busca equipamento e verifica disponibilidade
    const equipRes = await client.query(
      `SELECT e.*,
              GREATEST(e.quantidade_total - COALESCE(em_uso.total, 0), 0)::INTEGER AS quantidade_disponivel
       FROM equipamentos e
       LEFT JOIN (
         SELECT equipamento_id, SUM(quantidade)::INTEGER AS total
         FROM reservas
         WHERE status = 'aprovada'
         GROUP BY equipamento_id
       ) em_uso ON em_uso.equipamento_id = e.id
       WHERE e.id = $1`,
      [equipamento_id]
    );

    if (equipRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    const equip = equipRes.rows[0];

    if (parseInt(quantidade, 10) > equip.quantidade_disponivel) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Estoque insuficiente. Disponível: ${equip.quantidade_disponivel} unidade(s).`,
      });
    }

    // Decrementa o estoque total (retirada física permanente)
    await client.query(
      'UPDATE equipamentos SET quantidade_total = quantidade_total - $1 WHERE id = $2',
      [parseInt(quantidade, 10), equipamento_id]
    );

    // Busca nome do responsável (admin logado)
    const adminRes = await client.query(
      'SELECT nome FROM usuarios WHERE id = $1',
      [req.userId]
    );
    const responsavel_nome = adminRes.rows[0]?.nome || null;

    // Insere o log de retirada
    const result = await client.query(
      `INSERT INTO retiradas
         (colaborador_nome, colaborador_email, local_setor,
          equipamento_id, equipamento_nome, numero_serie, quantidade,
          responsavel_id, responsavel_nome, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        colaborador_nome.trim(),
        colaborador_email.trim().toLowerCase(),
        local_setor.trim(),
        equipamento_id,
        equip.nome,
        equip.numero_serie || null,
        parseInt(quantidade, 10),
        req.userId,
        responsavel_nome,
        observacoes?.trim() || null,
      ]
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

// ── GET /api/retiradas ────────────────────────────────────────────────────────
// Lista retiradas com filtros opcionais (somente admin)
router.get('/', adminMiddleware, async (req, res) => {
  const { busca = '', data_inicio, data_fim, page = 1, limit = 100 } = req.query;

  const conditions = [];
  const params = [];
  let idx = 1;

  if (busca.trim()) {
    conditions.push(
      `(r.colaborador_nome ILIKE $${idx} OR r.colaborador_email ILIKE $${idx}
        OR r.equipamento_nome ILIKE $${idx} OR r.local_setor ILIKE $${idx})`
    );
    params.push(`%${busca.trim()}%`);
    idx++;
  }

  if (data_inicio) {
    conditions.push(`r.criado_em >= $${idx}::date`);
    params.push(data_inicio);
    idx++;
  }

  if (data_fim) {
    conditions.push(`r.criado_em < ($${idx}::date + INTERVAL '1 day')`);
    params.push(data_fim);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT r.*
         FROM retiradas r
         ${where}
         ORDER BY r.criado_em DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, parseInt(limit, 10), offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM retiradas r ${where}`,
        params
      ),
    ]);

    res.json({
      retiradas: dataRes.rows,
      total: parseInt(countRes.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/retiradas/export ─────────────────────────────────────────────────
// Exporta retiradas como CSV (BOM UTF-8 para compatibilidade com Excel)
router.get('/export', adminMiddleware, async (req, res) => {
  const { busca = '', data_inicio, data_fim } = req.query;

  const conditions = [];
  const params = [];
  let idx = 1;

  if (busca.trim()) {
    conditions.push(
      `(r.colaborador_nome ILIKE $${idx} OR r.colaborador_email ILIKE $${idx}
        OR r.equipamento_nome ILIKE $${idx} OR r.local_setor ILIKE $${idx})`
    );
    params.push(`%${busca.trim()}%`);
    idx++;
  }

  if (data_inicio) {
    conditions.push(`r.criado_em >= $${idx}::date`);
    params.push(data_inicio);
    idx++;
  }

  if (data_fim) {
    conditions.push(`r.criado_em < ($${idx}::date + INTERVAL '1 day')`);
    params.push(data_fim);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT
         r.colaborador_nome            AS "Nome do Colaborador",
         r.colaborador_email           AS "E-mail",
         r.local_setor                 AS "Local/Setor",
         r.equipamento_nome            AS "Item Retirado",
         COALESCE(r.numero_serie, '')  AS "Nº Patrimônio",
         r.quantidade                  AS "Quantidade",
         TO_CHAR(r.criado_em AT TIME ZONE 'America/Sao_Paulo',
                 'DD/MM/YYYY HH24:MI') AS "Data e Hora",
         COALESCE(r.responsavel_nome, '') AS "Responsável",
         COALESCE(r.observacoes, '')   AS "Observações"
       FROM retiradas r
       ${where}
       ORDER BY r.criado_em DESC`,
      params
    );

    const COLS = [
      'Nome do Colaborador', 'E-mail', 'Local/Setor',
      'Item Retirado', 'Nº Patrimônio', 'Quantidade', 'Data e Hora',
      'Responsável', 'Observações',
    ];

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const lines = [
      COLS.join(';'),
      ...result.rows.map((row) => COLS.map((c) => escape(row[c])).join(';')),
    ];

    const csv = '﻿' + lines.join('\r\n');
    const date = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="retiradas_${date}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
