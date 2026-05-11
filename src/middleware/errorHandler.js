/**
 * Handler de erros centralizado.
 * Deve ser registrado APÓS todas as rotas no app.js.
 */
export function errorHandler(err, req, res, _next) {
  // Erros conhecidos do PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Registro duplicado.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referência inválida (chave estrangeira).' });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.expose || status < 500
    ? err.message
    : 'Erro interno. Tente novamente mais tarde.';

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({ error: message });
}

/**
 * Wrapper para handlers assíncronos — elimina try/catch repetitivos.
 * Uso: router.get('/rota', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}