import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { nome, email, senha, setor } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Preencha todos os campos' });

  try {
    const userExists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: 'Usuário já existe' });

    const hashedPassword = await bcrypt.hash(senha, 10);
    const newUser = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, setor) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, setor',
      [nome, email, hashedPassword, setor || null]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  try {
    const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(400).json({ error: 'Usuário não encontrado' });

    const validPassword = await bcrypt.compare(senha, user.rows[0].senha);
    if (!validPassword) return res.status(400).json({ error: 'Senha inválida' });

    const token = jwt.sign(
      { id: user.rows[0].id, admin: user.rows[0].admin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user.rows[0].id, nome: user.rows[0].nome, email: user.rows[0].email, admin: user.rows[0].admin }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retorna admin:true/false para o Sidebar mostrar o link correto
router.get('/perfil', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, nome, email, admin FROM usuarios WHERE id = $1',
      [req.userId]
    );
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/usuarios/perfil — colaborador edita próprio perfil (nome, email, senha, setor)
router.patch('/perfil', authMiddleware, async (req, res) => {
  const { nome, email, senha, setor } = req.body;
  try {
    let senhaHash = null;
    if (senha && senha.trim() !== '') {
      senhaHash = await bcrypt.hash(senha, 10);
    }

    if (email) {
      const existe = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, req.userId]
      );
      if (existe.rows.length > 0) {
        return res.status(400).json({ error: 'E-mail já em uso por outro usuário' });
      }
    }

    const result = await pool.query(
      `UPDATE usuarios
       SET nome  = COALESCE($1, nome),
           email = COALESCE($2, email),
           senha = COALESCE($3, senha),
           setor = COALESCE($4, setor)
       WHERE id = $5
       RETURNING id, nome, email, admin, setor`,
      [nome || null, email || null, senhaHash, setor || null, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
