import { setDefaultResultOrder } from 'node:dns';
setDefaultResultOrder('ipv4first'); // Evita ENETUNREACH em hosts sem IPv6 (ex.: Render)

import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import equipamentosRoutes from './routes/equipamentos.js';
import reservasRoutes from './routes/reservas.js';
import adminRoutes from './routes/admin.js';
import devolucoesRoutes from './routes/devolucoes.js';
import comentariosRoutes from './routes/comentarios.js';
import { authRateLimiter, apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import pool from './config/database.js';

async function runMigrations() {
  try {
    await pool.query(`
      ALTER TABLE comentarios DROP CONSTRAINT IF EXISTS comentarios_usuario_id_fkey;
      ALTER TABLE comentarios ADD CONSTRAINT comentarios_usuario_id_fkey
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
    `);
    console.log('✔ Migração FK comentarios_usuario_id aplicada');
  } catch (err) {
    console.error('Erro na migração FK:', err.message);
  }
}

dotenv.config();

const app = express();

// ── Segurança: cabeçalhos HTTP básicos ────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(o => o.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Body parser com limite de tamanho ─────────────────────────────────────
app.use(express.json({ limit: '100kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────
app.use('/api', apiRateLimiter);
app.use('/api/usuarios/login',    authRateLimiter);
app.use('/api/usuarios/register', authRateLimiter);

// ── Rotas ─────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/usuarios',     usuariosRoutes);
app.use('/api/equipamentos', equipamentosRoutes);
app.use('/api/reservas',     reservasRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/devolucoes',  devolucoesRoutes);
app.use('/api/reservas/:id/comentarios', comentariosRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// ── Handler de erros centralizado ────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
});

export default app;