import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      // Reconnect strategy: back off up to 10s
      retryStrategy(times) {
        if (times > 10) {
          logger.warn('Redis: max reconnect attempts reached, giving up');
          return null; // stop retrying
        }
        const delay = Math.min(times * 500, 10_000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis: connecting...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('Redis: ready');
    });

    redisClient.on('error', (err: Error) => {
      isConnected = false;
      // Log the error but do NOT throw — Redis failure is non-fatal
      logger.warn('Redis: connection error', { error: err.message });
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('Redis: connection closed');
    });

    redisClient.on('reconnecting', (delay: number) => {
      logger.info(`Redis: reconnecting in ${delay}ms`);
    });
  }

  return redisClient;
}

export function isRedisConnected(): boolean {
  return isConnected;
}

/**
 * Graceful shutdown — call during SIGTERM handler.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info('Redis: connection closed gracefully');
  }
}

/**
 * Safe cache get. Returns null on any error rather than throwing.
 * Cache misses fall through — never block the request path.
 */
export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await getRedis().get(key);
  } catch (err) {
    logger.warn('Redis: cacheGet failed, falling through to DB', {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Safe cache set. Swallows errors — a failed cache write is non-fatal.
 */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  try {
    if (ttlSeconds !== undefined) {
      await getRedis().set(key, value, 'EX', ttlSeconds);
    } else {
      await getRedis().set(key, value);
    }
  } catch (err) {
    logger.warn('Redis: cacheSet failed', {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Safe cache delete. Swallows errors.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    await getRedis().del(...keys);
  } catch (err) {
    logger.warn('Redis: cacheDel failed', {
      keys,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Check if a JWT JTI is blacklisted.
 * Fails OPEN with a warning — does not block the request.
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const result = await getRedis().get(`blacklist:jti:${jti}`);
    return result !== null;
  } catch (err) {
    logger.warn('Redis: token blacklist check failed, failing open', {
      jti,
      error: err instanceof Error ? err.message : String(err),
    });
    // Fail open — do NOT block requests when Redis is unavailable
    return false;
  }
}

/**
 * Blacklist a JWT JTI until its expiry.
 */
export async function blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
  await cacheSet(`blacklist:jti:${jti}`, '1', ttlSeconds);
}