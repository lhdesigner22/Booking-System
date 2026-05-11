import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export async function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não enviado' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;

    const result = await pool.query('SELECT admin FROM usuarios WHERE id = $1', [decoded.id]);
    if (!result.rows[0]?.admin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
