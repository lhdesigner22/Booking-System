-- Migration: adiciona local de uso nas reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS local_uso VARCHAR(200);
