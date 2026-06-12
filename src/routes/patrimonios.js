import express from 'express';
import { pool } from '../config/database.js';
import { adminMiddleware } from '../middleware/adminAuth.js';

const router = express.Router();

// GET /api/patrimonios?equipamento_id=X
router.get('/', adminMiddleware, async (req, res) => {
  const { equipamento_id } = req.query;
  if (!equipamento_id) return res.status(400).json({ error: 'equipamento_id é obrigatório' });
  try {
    const result = await pool.query(
      `SELECT p.*,
              EXISTS(
                SELECT 1 FROM reserva_patrimonios rp
                JOIN reservas r ON r.id = rp.reserva_id
                WHERE rp.patrimonio_id = p.id AND r.status = 'aprovada'
              ) AS em_uso
       FROM patrimonios p
       WHERE p.equipamento_id = $1
       ORDER BY p.codigo`,
      [equipamento_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/patrimonios
router.post('/', adminMiddleware, async (req, res) => {
  const { equipamento_id, codigo, descricao } = req.body;
  if (!equipamento_id || !codigo?.trim())
    return res.status(400).json({ error: 'equipamento_id e codigo são obrigatórios' });
  try {
    const result = await pool.query(
      `INSERT INTO patrimonios (equipamento_id, codigo, descricao)
       VALUES ($1, $2, $3) RETURNING *`,
      [equipamento_id, codigo.trim(), descricao?.trim() || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Código de patrimônio já existe' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/patrimonios/:id
router.put('/:id', adminMiddleware, async (req, res) => {
  const { codigo, descricao } = req.body;
  if (!codigo?.trim()) return res.status(400).json({ error: 'codigo é obrigatório' });
  try {
    const result = await pool.query(
      `UPDATE patrimonios SET codigo = $1, descricao = $2 WHERE id = $3 RETURNING *`,
      [codigo.trim(), descricao?.trim() || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patrimônio não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Código de patrimônio já existe' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/patrimonios/:id
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const emUso = await pool.query(
      `SELECT rp.id FROM reserva_patrimonios rp
       JOIN reservas r ON r.id = rp.reserva_id
       WHERE rp.patrimonio_id = $1 AND r.status = 'aprovada'`,
      [req.params.id]
    );
    if (emUso.rows.length > 0)
      return res.status(409).json({ error: 'Patrimônio está em uso em uma reserva ativa' });

    const result = await pool.query(
      'DELETE FROM patrimonios WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Patrimônio não encontrado' });
    res.json({ mensagem: 'Patrimônio removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
