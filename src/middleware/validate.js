/**
 * Middleware de validação de entrada.
 * Uso: validate(schema) onde schema é um objeto { campo: { required, type, minLength, maxLength, isEmail, min, max } }
 */

export function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      const isEmpty = value === undefined || value === null || value === '';

      if (rules.required && isEmpty) {
        errors.push(`${field} é obrigatório`);
        continue;
      }
      if (isEmpty) continue;

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} deve ser texto`);
        continue;
      }
      if (rules.type === 'number' && isNaN(Number(value))) {
        errors.push(`${field} deve ser um número`);
        continue;
      }
      if (rules.type === 'boolean' && value !== true && value !== false && value !== 'true' && value !== 'false') {
        errors.push(`${field} deve ser verdadeiro ou falso`);
        continue;
      }
      if (rules.minLength && String(value).trim().length < rules.minLength) {
        errors.push(`${field} deve ter ao menos ${rules.minLength} caracteres`);
      }
      if (rules.maxLength && String(value).trim().length > rules.maxLength) {
        errors.push(`${field} deve ter no máximo ${rules.maxLength} caracteres`);
      }
      if (rules.isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          errors.push(`${field} deve ser um e-mail válido`);
        }
      }
      if (rules.isDate) {
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          errors.push(`${field} deve ser uma data válida`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('; ') });
    }
    next();
  };
}