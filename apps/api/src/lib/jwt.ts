import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { isTokenBlacklisted } from './redis.js';
import { logger } from './logger.js';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: 'attendee' | 'organizer' | 'admin';
  jti: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  family: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: '15m',
  };
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: '15m',
  };
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, options);
}

/**
 * Verifies an access token and checks it has not been blacklisted in Redis.
 * Throws if invalid, expired, or blacklisted.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  let payload: AccessTokenPayload;

  try {
    payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error('ACCESS_TOKEN_EXPIRED');
    }
    throw new Error('ACCESS_TOKEN_INVALID');
  }

  const blacklisted = await isTokenBlacklisted(payload.jti);
  if (blacklisted) {
    logger.warn('Attempted use of blacklisted token', { jti: payload.jti });
    throw new Error('ACCESS_TOKEN_BLACKLISTED');
  }

  return payload;
}

/**
 * Verifies a refresh token (signature + expiry only).
 * Revocation is checked in the DB by auth.service.ts.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    throw new Error('REFRESH_TOKEN_INVALID');
  }
}

/**
 * Returns remaining TTL in seconds for an access token.
 * Used when blacklisting on logout.
 */
export function getTokenRemainingTtl(token: string): number {
  try {
    const payload = jwt.decode(token) as AccessTokenPayload | null;
    if (!payload?.exp) return 0;
    const remaining = payload.exp - Math.floor(Date.now() / 1000);
    return Math.max(0, remaining);
  } catch {
    return 0;
  }
}