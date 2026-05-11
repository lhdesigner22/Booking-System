CREATE TABLE IF NOT EXISTS comentarios (
  id          SERIAL PRIMARY KEY,
  reserva_id  INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id),
  mensagem    TEXT    NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_reserva ON comentarios(reserva_id);
