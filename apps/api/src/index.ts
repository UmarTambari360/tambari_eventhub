import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { config, isDev } from './config/index.js';
import { logger } from './lib/logger.js';
import { getRedis, closeRedis } from './lib/redis.js';
import { closeDb } from './db/index.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';

// PHASE 6: import { uploadRouter } from './routes/upload.routes.js';
// PHASE 7: import { webhookRouter } from './routes/webhook.routes.js';

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: isDev ? ['http://localhost:3000'] : [config.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  })
);

// ─── Request ID (must be before logging) ─────────────────────────────────────

app.use(requestIdMiddleware);

// ─── Logging ─────────────────────────────────────────────────────────────────

app.use(
  morgan(isDev ? 'dev' : 'combined', {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
    skip: (req) =>
      req.path === '/health' || req.path === '/health/ready',
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────

// NOTE: Webhook route must register BEFORE json() parser to get raw body.
// PHASE 7: app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(config.COOKIE_SECRET));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/health', healthRouter);
app.use('/auth', authRouter);

// PHASE 6: app.use('/upload', uploadRouter);
// PHASE 7: app.use('/webhooks', webhookRouter);

// 404 handler — must be after all routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource does not exist.',
    },
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorMiddleware);

// ─── Startup ──────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  try {
    await getRedis().connect();
  } catch {
    // Redis failure is non-fatal at startup — logged inside getRedis()
  }

  const server = app.listen(config.PORT, () => {
    logger.info('API server started', {
      port: config.PORT,
      env: config.NODE_ENV,
      url: config.API_URL,
    });
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');

      // PHASE 8: await closeBullMQWorkers();

      await closeRedis();
      await closeDb();

      logger.info('Shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 15_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error('Fatal error during startup', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});

export { app };