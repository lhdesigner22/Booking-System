-- Migration: controle de estoque
-- Execute no banco reservas_ti

-- 1. Adiciona campos de estoque na tabela equipamentos
ALTER TABLE equipamentos
  ADD COLUMN IF NOT EXISTS quantidade_total   INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS numero_serie       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS categoria          VARCHAR(60);

-- 2. Garante que quantidade_total nunca seja negativa
ALTER TABLE equipamentos
  ADD CONSTRAINT chk_quantidade_total_positiva
  CHECK (quantidade_total >= 0);

-- Verificação (opcional):
-- SELECT id, nome, quantidade_total, numero_serie, categoria FROM equipamentos;
