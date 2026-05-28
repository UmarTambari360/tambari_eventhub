import winston from 'winston';
import { config, isDev } from '../config/index.js';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, requestId, ...meta }) => {
    const rid = requestId ? ` [${String(requestId)}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${String(timestamp)} ${level}${rid}: ${String(message)}${metaStr}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: isDev ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
  // In production, add file/external transports here as needed
  silent: false,
});

// Create a child logger with request context
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}