-- Migration: suporte a devoluções
-- Execute no banco reservas_ti

-- 1. Adiciona coluna para registrar data/hora da devolução
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS devolvida_em TIMESTAMP;

-- 2. O status 'devolvida' já é suportado pela coluna VARCHAR existente.
--    Nenhuma alteração de constraint é necessária.

-- Verificação (opcional):
-- SELECT id, status, devolvida_em FROM reservas WHERE status = 'devolvida';
