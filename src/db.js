import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DB_URL;

if (!connectionString) {
  throw new Error('DB_URL is missing. Check your environment variables.');
}

export const pool = new pg.Pool({ connectionString });