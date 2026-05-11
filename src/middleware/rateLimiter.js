// Rate limiter simples em memória — sem dependências externas
// Limite: 60 req / 60 s por IP (configurável)
const store = new Map();

export function rateLimiter({ max = 60, windowMs = 60_000 } = {}) {
  return (req, res, next) => {
    const key = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = store.get(key) || { count: 0, start: now };

    if (now - entry.start > windowMs) {
      entry.count = 1;
      entry.start = now;
    } else {
      entry.count += 1;
    }
    store.set(key, entry);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));

    if (entry.count > max) {
      return res.status(429).json({ error: 'Muitas requisições. Tente novamente em breve.' });
    }
    next();
  };
}

const isDev = process.env.NODE_ENV !== 'production';

export const authRateLimiter = rateLimiter({ max: isDev ? 200 : 10,  windowMs: 60_000 });
export const apiRateLimiter  = rateLimiter({ max: isDev ? 500 : 120, windowMs: 60_000 });