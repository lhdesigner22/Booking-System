-- Adiciona campo quantidade na tabela reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS quantidade INTEGER NOT NULL DEFAULT 1;
