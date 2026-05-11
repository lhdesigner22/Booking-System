import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Verifica se o usuário tem acesso à reserva (dono ou admin)
async function checkAcesso(reservaId, userId, isAdmin) {
  const r = await pool.query('SELECT usuario_id FROM reservas WHERE id = $1', [reservaId]);
  if (r.rows.length === 0) return false;
  return isAdmin || r.rows[0].usuario_id === userId;
}

// GET /api/reservas/:id/comentarios
router.get('/', authMiddleware, async (req, res) => {
  const reservaId = parseInt(req.params.id, 10);
  try {
    const acesso = await checkAcesso(reservaId, req.userId, req.isAdmin);
    if (!acesso) return res.status(403).json({ error: 'Acesso negado' });

    const result = await pool.query(
      `SELECT c.id, c.mensagem, c.created_at,
              u.id   AS usuario_id,
              u.nome AS usuario_nome,
              u.admin AS usuario_admin
       FROM comentarios c
       JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.reserva_id = $1
       ORDER BY c.created_at ASC`,
      [reservaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reservas/:id/comentarios
router.post('/', authMiddleware, async (req, res) => {
  const reservaId = parseInt(req.params.id, 10);
  const { mensagem } = req.body;

  if (!mensagem || !mensagem.trim())
    return res.status(400).json({ error: 'Mensagem não pode ser vazia' });

  if (mensagem.trim().length > 1000)
    return res.status(400).json({ error: 'Mensagem muito longa (máx. 1000 caracteres)' });

  try {
    const acesso = await checkAcesso(reservaId, req.userId, req.isAdmin);
    if (!acesso) return res.status(403).json({ error: 'Acesso negado' });

    const result = await pool.query(
      `INSERT INTO comentarios (reserva_id, usuario_id, mensagem)
       VALUES ($1, $2, $3)
       RETURNING id, mensagem, created_at`,
      [reservaId, req.userId, mensagem.trim()]
    );

    const user = await pool.query(
      'SELECT id, nome, admin FROM usuarios WHERE id = $1',
      [req.userId]
    );

    res.status(201).json({
      ...result.rows[0],
      usuario_id:    user.rows[0].id,
      usuario_nome:  user.rows[0].nome,
      usuario_admin: user.rows[0].admin,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
