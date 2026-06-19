/**
 * Standalone BullMQ worker process.
 *
 * In production, this runs as a separate Railway service using the same
 * Docker image but with CMD ["node", "apps/api/dist/worker.js"].
 * This prevents job processing from competing with the API event loop.
 *
 * In development, workers run inside the main API process (apps/api/src/index.ts).
 */
import 'dotenv/config';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { getRedis, closeRedis } from './lib/redis.js';
import { closeDb } from './db/index.js';
import { createEmailWorker } from './jobs/workers/email.worker.js';
import { createWebhookWorker } from './jobs/workers/webhook.worker.js';
import { createCleanupWorker } from './jobs/workers/cleanup.worker.js';
import { createQrCodeWorker } from './jobs/workers/qrcode.worker.js';
import { createExportWorker } from './jobs/workers/export.worker.js';

logger.info('BullMQ worker process starting', {
  nodeEnv: config.NODE_ENV,
  pid: process.pid,
});

async function start(): Promise<void> {
  // Connect Redis
  try {
    await getRedis().connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.error('Failed to connect to Redis — workers cannot start without it', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }

  // Start all workers
  const workers = [
    createEmailWorker(),
    createWebhookWorker(),
    createCleanupWorker(),
    createQrCodeWorker(),
    createExportWorker(),
  ];

  logger.info('All BullMQ workers started', { count: workers.length });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down workers gracefully`);

    // Close all workers — waits for in-progress jobs to complete
    await Promise.allSettled(workers.map((w) => w.close()));
    logger.info('All workers closed');

    await closeRedis();
    await closeDb();

    logger.info('Worker process shutdown complete');
    process.exit(0);
  };

  // Force kill after 30s if graceful shutdown hangs
  const forceKill = (signal: string) => {
    logger.error(`${signal} graceful shutdown timed out — forcing exit`);
    process.exit(1);
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
    setTimeout(() => forceKill('SIGTERM'), 30_000);
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
    setTimeout(() => forceKill('SIGINT'), 30_000);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception in worker process', {
      error: err.message,
      stack: err.stack,
    });
    // Don't exit — BullMQ's retry mechanism will handle job failures
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection in worker process', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });
}

start().catch((err) => {
  logger.error('Fatal error starting worker process', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});