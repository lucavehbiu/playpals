import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { log } from './vite';
import * as schema from '@shared/schema';

const { Pool } = pg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log database connection
pool.on('connect', () => {
  log('Connected to PostgreSQL database', 'database');
});

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
