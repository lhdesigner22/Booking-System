import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { notificarNovaMensagemChat } from '../services/emailService.js';

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
    const remetente = user.rows[0];

    res.status(201).json({
      ...result.rows[0],
      usuario_id:    remetente.id,
      usuario_nome:  remetente.nome,
      usuario_admin: remetente.admin,
    });

    // Notifica o(s) destinatário(s) por e-mail (fire-and-forget)
    const reservaInfo = await pool.query(
      `SELECT r.usuario_id, u.nome AS usuario_nome, u.email AS usuario_email,
              e.nome AS equipamento_nome
       FROM reservas r
       JOIN usuarios    u ON u.id = r.usuario_id
       JOIN equipamentos e ON e.id = r.equipamento_id
       WHERE r.id = $1`,
      [reservaId]
    );
    if (reservaInfo.rows.length > 0) {
      const rv = reservaInfo.rows[0];
      let destinatarios;
      if (remetente.admin) {
        // Admin enviou → notifica o dono da reserva
        destinatarios = [{ nome: rv.usuario_nome, email: rv.usuario_email, isAdmin: false }];
      } else {
        // Usuário enviou → notifica todos os admins
        const admins = await pool.query(
          "SELECT nome, email FROM usuarios WHERE admin = true AND email IS NOT NULL"
        );
        destinatarios = admins.rows.map(a => ({ nome: a.nome, email: a.email, isAdmin: true }));
      }
      notificarNovaMensagemChat({
        reservaId,
        equipamento:   rv.equipamento_nome,
        remetente:     remetente.nome,
        mensagem:      mensagem.trim(),
        destinatarios,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
