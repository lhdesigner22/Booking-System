-- Migration: suporte a login com Google
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) UNIQUE;
ALTER TABLE usuarios ALTER COLUMN senha DROP NOT NULL;
