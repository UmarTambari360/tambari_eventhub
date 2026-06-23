import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { config, isDev, isProd } from './config/index.js';
import { logger } from './lib/logger.js';
import { getRedis, closeRedis } from './lib/redis.js';
import { closeDb } from './db/index.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import {
  apiLimiter,
  publicApiLimiter,
  adminLimiter,
  webhookLimiter,
} from './middleware/rate-limit.middleware.js';
import { authenticate, requireRole } from './middleware/auth.middleware.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { organizerRouter } from './routes/organizer.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { eventRouter } from './routes/event.routes.js';
import { uploadRouter } from './routes/upload.routes.js';
import { webhookRouter } from './routes/webhook.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { createEmailWorker } from './jobs/workers/email.worker.js';
import { createWebhookWorker } from './jobs/workers/webhook.worker.js';
import { createCleanupWorker } from './jobs/workers/cleanup.worker.js';
import { createQrCodeWorker } from './jobs/workers/qrcode.worker.js';
import { createExportWorker } from './jobs/workers/export.worker.js';

const app: express.Application = express();

if (isProd) {
  app.set('trust proxy', 1);
}

// ─── Security headers & CORS ──────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'res.cloudinary.com', '*.cloudinary.com'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
    strictTransportSecurity: isProd
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
  })
);

const allowedOrigins = isDev
  ? ['http://localhost:3000', 'http://localhost:3001']
  : [config.FRONTEND_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400,
  })
);

app.use(requestIdMiddleware);

// ─── HTTP logging ─────────────────────────────────────────────────────────────
app.use(
  morgan(isDev ? 'dev' : 'combined', {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
    skip: (req) => req.path === '/health' || req.path === '/health/ready',
  })
);

// ─── Webhook middleware (Must precede express.json) ───────────────────────────
app.use(
  '/webhooks',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  webhookRouter
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(config.COOKIE_SECRET));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/auth', authRouter);

app.use('/events', publicApiLimiter, eventRouter);
app.use('/organizer', apiLimiter, organizerRouter);
app.use('/orders', apiLimiter, orderRouter);
app.use('/upload', apiLimiter, uploadRouter);
app.use('/analytics', apiLimiter, analyticsRouter);
app.use('/admin', adminLimiter, adminRouter);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource does not exist.',
    },
  });
});

app.use(errorMiddleware);

// ─── Startup & Lifecycle ──────────────────────────────────────────────────────
async function start(): Promise<void> {
  try {
    await getRedis().connect();
  } catch {
    logger.warn('Redis connection failed at startup — proceeding without cache');
  }

  if (!isProd) {
    createEmailWorker();
    createWebhookWorker();
    createCleanupWorker();
    createQrCodeWorker();
    createExportWorker();
    logger.info('In-process BullMQ workers started (development mode)');
  } else {
    logger.info('Production mode: BullMQ workers should run as a separate service');
  }

  const server = app.listen(config.PORT, () => {
    logger.info('API server started', {
      port: config.PORT,
      env: config.NODE_ENV,
      url: config.API_URL,
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');
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

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });
}

start().catch((err) => {
  logger.error('Fatal error during startup', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});

export { app };