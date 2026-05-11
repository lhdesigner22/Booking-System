# Reservas TI

Sistema de reserva de equipamentos de TI.

## Estrutura

```
reservas-ti/          ← Backend (Node.js + Express + PostgreSQL)
  src/
    app.js            ← Entry point do servidor
    config/database.js
    middleware/auth.js
    routes/
      usuarios.js
      equipamentos.js
      reservas.js
  .env

reservas-ti-frontend/ ← Frontend (React + Vite)
  src/
    App.jsx           ← Roteador principal
    main.jsx          ← Entry point React
    services/api.js   ← Cliente HTTP (axios)
    pages/
      login.jsx
      register.jsx
      equipamentos.jsx
      reservas.jsx
```

## Como rodar

### 1. Banco de dados (PostgreSQL)

Crie o banco e as tabelas:

```sql
CREATE DATABASE reservas_ti;

\c reservas_ti

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha TEXT NOT NULL
);

CREATE TABLE equipamentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  disponivel BOOLEAN DEFAULT true
);

CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  equipamento_id INTEGER REFERENCES equipamentos(id),
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente'
);
```

### 2. Backend

```bash
# Na raiz do projeto
cp .env.example .env   # edite com suas credenciais
npm install
npm run dev            # http://localhost:3000
```

### 3. Frontend

```bash
cd reservas-ti-frontend
npm install
npm run dev            # http://localhost:5173
```

O Vite está configurado com proxy: todas as chamadas `/api/*` são
encaminhadas automaticamente para `http://localhost:3000`.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/usuarios/register | Cadastrar usuário |
| POST | /api/usuarios/login | Login |
| GET | /api/usuarios/perfil | Perfil do usuário logado |
| GET | /api/equipamentos | Listar equipamentos |
| POST | /api/equipamentos | Cadastrar equipamento |
| GET | /api/equipamentos/:id/disponibilidade | Checar disponibilidade |
| GET | /api/reservas | Listar reservas do usuário |
| POST | /api/reservas | Criar reserva |
| PATCH | /api/reservas/:id/status | Atualizar status |

## Coluna admin no banco

Execute esta migration para habilitar o painel de administrador:

```sql
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS admin BOOLEAN DEFAULT false;

-- Para tornar um usuário admin (substitua o email):
UPDATE usuarios SET admin = true WHERE email = 'admin@empresa.com';
```

## Rotas admin

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/admin/reservas | Listar TODAS as reservas |
| PATCH | /api/admin/reservas/:id/status | Aprovar ou recusar qualquer reserva |
