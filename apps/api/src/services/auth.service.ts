import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users, refreshTokens } from '../db/schema/index.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getTokenRemainingTtl,
} from '../lib/jwt.js';
import { blacklistToken } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

const BCRYPT_ROUNDS = 12;
// Matches JWT_REFRESH_EXPIRES_IN "7d" in milliseconds
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

async function issueTokenPair(
  userId: string,
  email: string,
  role: 'attendee' | 'organizer' | 'admin',
  family: string
): Promise<AuthTokenPair> {
  const accessJti = uuidv4();
  const refreshJti = uuidv4();

  const accessToken = signAccessToken({ userId, email, role, jti: accessJti });
  const refreshToken = signRefreshToken({ userId, family, jti: refreshJti });

  const tokenHash = await hashToken(refreshToken);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    family,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    isRevoked: false,
  });

  return { accessToken, refreshToken };
}

// ─── Public service functions ─────────────────────────────────────────────────

export async function register(input: RegisterInput): Promise<{
  user: { id: string; email: string; fullName: string; role: string };
  tokens: AuthTokenPair;
}> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    throw Object.assign(new Error('An account with this email already exists.'), {
      statusCode: 409,
      code: 'EMAIL_TAKEN',
    });
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash,
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      role: 'attendee',
    })
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
    });

  if (!user) throw new Error('Failed to create user account.');

  const family = uuidv4();
  const tokens = await issueTokenPair(user.id, user.email, user.role, family);

  logger.info('User registered', { userId: user.id, email: user.email });

  // PHASE 8: enqueue send-welcome email job

  return { user, tokens };
}

export async function login(input: LoginInput): Promise<{
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isSuspended: boolean;
  };
  tokens: AuthTokenPair;
}> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (!user) {
    throw Object.assign(new Error('Invalid email or password.'), {
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw Object.assign(new Error('Invalid email or password.'), {
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  }

  if (user.isSuspended) {
    throw Object.assign(
      new Error('Your account has been suspended. Please contact support.'),
      { statusCode: 403, code: 'ACCOUNT_SUSPENDED' }
    );
  }

  const family = uuidv4();
  const tokens = await issueTokenPair(user.id, user.email, user.role, family);

  logger.info('User logged in', { userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isSuspended: user.isSuspended,
    },
    tokens,
  };
}

export async function refresh(incomingRefreshToken: string): Promise<{
  user: { id: string; email: string; role: string };
  tokens: AuthTokenPair;
}> {
  // 1. Verify JWT signature + expiry
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch (err) {
    throw Object.assign(new Error('Invalid or expired refresh token.'), {
      statusCode: 401,
      code: 'REFRESH_TOKEN_INVALID',
    });
  }

  // 2. Find all non-expired, non-revoked tokens in this family
  const familyTokens = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, payload.userId),
        eq(refreshTokens.family, payload.family),
        eq(refreshTokens.isRevoked, false)
      )
    );

  // 3. Find the matching token by comparing hashes
  let matchedToken: (typeof familyTokens)[0] | undefined;
  for (const record of familyTokens) {
    const matches = await bcrypt.compare(incomingRefreshToken, record.tokenHash);
    if (matches) {
      matchedToken = record;
      break;
    }
  }

  // 4. If no match — token reuse detected. Revoke entire family.
  if (!matchedToken) {
    logger.warn('Refresh token reuse detected — revoking family', {
      userId: payload.userId,
      family: payload.family,
    });

    // Revoke all tokens in this family
    if (familyTokens.length > 0) {
      await db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(
          and(
            eq(refreshTokens.userId, payload.userId),
            eq(refreshTokens.family, payload.family)
          )
        );
    }

    throw Object.assign(
      new Error('Security alert: refresh token reuse detected. Please log in again.'),
      { statusCode: 401, code: 'TOKEN_REUSE_DETECTED' }
    );
  }

  // 5. Revoke the used token
  await db
    .update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.id, matchedToken.id));

  // 6. Load user
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isSuspended: users.isSuspended,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) {
    throw Object.assign(new Error('User not found.'), {
      statusCode: 401,
      code: 'USER_NOT_FOUND',
    });
  }

  if (user.isSuspended) {
    throw Object.assign(
      new Error('Your account has been suspended. Please contact support.'),
      { statusCode: 403, code: 'ACCOUNT_SUSPENDED' }
    );
  }

  // 7. Issue new token pair in the same family (rotation)
  const tokens = await issueTokenPair(user.id, user.email, user.role, payload.family);

  logger.info('Token refreshed', { userId: user.id });

  return { user: { id: user.id, email: user.email, role: user.role }, tokens };
}

export async function logout(
  accessToken: string,
  refreshToken: string | undefined
): Promise<void> {
  // Blacklist the access token JTI in Redis
  const ttl = getTokenRemainingTtl(accessToken);
  if (ttl > 0) {
    try {
      const { jti } = (await import('jsonwebtoken')).decode(accessToken) as {
        jti: string;
      };
      if (jti) await blacklistToken(jti, ttl);
    } catch {
      // Non-fatal — token may already be expired
    }
  }

  // Revoke the refresh token if provided
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      // Find and revoke matching token
      const familyTokens = await db
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.userId, payload.userId),
            eq(refreshTokens.family, payload.family),
            eq(refreshTokens.isRevoked, false)
          )
        );

      for (const record of familyTokens) {
        const matches = await bcrypt.compare(refreshToken, record.tokenHash);
        if (matches) {
          await db
            .update(refreshTokens)
            .set({ isRevoked: true })
            .where(eq(refreshTokens.id, record.id));
          break;
        }
      }
    } catch {
      // Non-fatal — refresh token may already be expired or invalid
    }
  }

  logger.info('User logged out');
}

export async function logoutAll(userId: string, accessToken: string): Promise<void> {
  // Blacklist current access token
  const ttl = getTokenRemainingTtl(accessToken);
  if (ttl > 0) {
    try {
      const { jti } = (await import('jsonwebtoken')).decode(accessToken) as {
        jti: string;
      };
      if (jti) await blacklistToken(jti, ttl);
    } catch {
      // Non-fatal
    }
  }

  // Revoke all refresh tokens for this user
  await db
    .update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.userId, userId));

  logger.info('All sessions revoked', { userId });
}