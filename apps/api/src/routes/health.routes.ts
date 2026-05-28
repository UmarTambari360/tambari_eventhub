import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { isRedisConnected, getRedis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

const router: ExpressRouter = Router();

/**
 * GET /health
 * Liveness probe — is the process alive?
 * Always returns 200 as long as the process is running.
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready
 * Readiness probe — are all dependencies reachable?
 * Returns 200 only when both Postgres and Redis are healthy.
 */
router.get('/ready', async (_req: Request, res: Response) => {
  let postgresOk = false;
  let redisOk = false;

  // Check Postgres
  try {
    await db.execute(sql`SELECT 1`);
    postgresOk = true;
  } catch (err) {
    logger.warn('Health check: Postgres unavailable', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Check Redis
  try {
    if (isRedisConnected()) {
      await getRedis().ping();
      redisOk = true;
    }
  } catch (err) {
    logger.warn('Health check: Redis unavailable', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const allHealthy = postgresOk && redisOk;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      postgres: postgresOk,
      redis: redisOk,
    },
  });
});

export { router as healthRouter };