import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import * as schema from './schema/index.js';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  min: 2,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  logger.error('Postgres pool error', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('Postgres: new client connected');
});

export const db = drizzle(pool, { schema });

export { pool };

export async function closeDb(): Promise<void> {
  await pool.end();
  logger.info('Postgres: pool closed gracefully');
}