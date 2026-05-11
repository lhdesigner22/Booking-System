-- Migration: adiciona setor/curso nos usuários
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS setor VARCHAR(100);
