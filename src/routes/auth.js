import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../config/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google — autentica via Google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Credencial não fornecida' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name } = ticket.getPayload();

    // Busca usuário pelo google_id ou email
    let result = await pool.query(
      'SELECT * FROM usuarios WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    let user;
    if (result.rows.length === 0) {
      // Cria novo usuário
      const insert = await pool.query(
        'INSERT INTO usuarios (nome, email, google_id) VALUES ($1, $2, $3) RETURNING id, nome, email, admin',
        [name, email, googleId]
      );
      user = insert.rows[0];
    } else {
      user = result.rows[0];
      // Vincula google_id se ainda não estiver salvo
      if (!user.google_id) {
        await pool.query('UPDATE usuarios SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      }
    }

    const token = jwt.sign(
      { id: user.id, admin: user.admin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email, admin: user.admin },
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ error: 'Token do Google inválido' });
  }
});

export default router;
