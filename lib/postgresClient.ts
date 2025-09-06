import { Pool } from 'pg';

// Direct PostgreSQL connection for local development
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

console.log("🔧 PostgreSQL Client Config:", {
  nodeEnv: process.env.NODE_ENV,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  databaseUrl: process.env.DATABASE_URL?.substring(0, 30) + "...",
});

export const postgresClient = pool; 