-- ============================================================
-- Schema completo - Reservas TI
-- Execute este arquivo no banco de dados na nuvem (Neon, Supabase, etc.)
-- ============================================================

-- 1. Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id       SERIAL PRIMARY KEY,
  nome     VARCHAR(100) NOT NULL,
  email    VARCHAR(150) NOT NULL UNIQUE,
  senha    VARCHAR(255) NOT NULL,
  admin    BOOLEAN      NOT NULL DEFAULT false
);

-- 2. Tabela de equipamentos
CREATE TABLE IF NOT EXISTS equipamentos (
  id               SERIAL PRIMARY KEY,
  nome             VARCHAR(100) NOT NULL,
  descricao        TEXT,
  disponivel       BOOLEAN      NOT NULL DEFAULT true,
  quantidade_total INTEGER      NOT NULL DEFAULT 1,
  numero_serie     VARCHAR(100),
  categoria        VARCHAR(60),
  CONSTRAINT chk_quantidade_total_positiva CHECK (quantidade_total >= 0)
);

-- 3. Tabela de reservas
CREATE TABLE IF NOT EXISTS reservas (
  id             SERIAL PRIMARY KEY,
  usuario_id     INTEGER      NOT NULL REFERENCES usuarios(id),
  equipamento_id INTEGER      NOT NULL REFERENCES equipamentos(id),
  data_inicio    TIMESTAMP    NOT NULL,
  data_fim       TIMESTAMP    NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'pendente',
  devolvida_em   TIMESTAMP,
  quantidade     INTEGER      NOT NULL DEFAULT 1
);

-- 4. Tabela de comentários
CREATE TABLE IF NOT EXISTS comentarios (
  id          SERIAL PRIMARY KEY,
  reserva_id  INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  mensagem    TEXT    NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_reserva ON comentarios(reserva_id);
