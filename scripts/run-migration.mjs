import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = readFileSync(resolve(__dirname, '../supabase/migrations/00001_initial_schema.sql'), 'utf8');

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:%40SPLITUP%40123@db.yfeofgphxjsvilrxrpjk.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

try {
  console.log('Connecting to Supabase Postgres...');
  await pool.query(sql);
  console.log('✅ Migration executed successfully');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
