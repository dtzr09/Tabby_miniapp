import { Pool } from 'pg';

// Direct PostgreSQL connection for local development
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});


export const postgresClient = pool; 