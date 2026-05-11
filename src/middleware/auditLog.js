// Middleware simples de log de auditoria — grava ações críticas no console (e pode ser estendido para banco)
export function auditLog(acao) {
  return (req, _res, next) => {
    const usuario = req.userId ? `userId:${req.userId}` : 'anonimo';
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'desconhecido';
    const detalhe = JSON.stringify(req.body || {}).slice(0, 200);
    console.log(`[AUDIT] ${new Date().toISOString()} | ${acao} | ${usuario} | ip:${ip} | ${detalhe}`);
    next();
  };
}