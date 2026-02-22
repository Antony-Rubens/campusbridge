import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL not found in env');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function connectDB() {
  await pool.query('SELECT 1');
  console.log('✅ PostgreSQL connected');
}