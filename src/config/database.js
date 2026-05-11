import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Em produção/nuvem o SSL é obrigatório; localmente não precisa.
const sslConfig = process.env.DATABASE_URL?.includes('localhost')
  ? false
  : { rejectUnauthorized: false };

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});