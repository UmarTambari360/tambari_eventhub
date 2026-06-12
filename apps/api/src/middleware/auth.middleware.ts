import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken }                from '../lib/jwt.js';
import type { AccessTokenPayload }       from '../lib/jwt.js';
import { db }                         from '../db/index.js';
import { organizerProfiles }       from '../db/schema/index.js';
import { eq }                   from 'drizzle-orm';
import type { UserRole }      from '@eventhub/types';

// Extend Express Request with authenticated user context
declare global {
  namespace Express {
    interface Request {
      user: AccessTokenPayload;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
    jti: string;
  };
}

/**
 * Verifies Bearer token and attaches req.user.
 * Returns 401 if missing or invalid.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    const message =
      err instanceof Error && err.message === 'ACCESS_TOKEN_EXPIRED'
        ? 'Your session has expired. Please log in again.'
        : 'Invalid authentication token.';

    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message },
    });
  }
}

/**
 * Factory: require a specific role (or one of several roles).
 * Must be used AFTER authenticate.
 */
export function requireRole(...roles: Array<'attendee' | 'organizer' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
        },
      });
      return;
    }

    next();
  };
}

/**
 * Ensures the organizer's profile is approved.
 * Must be used AFTER authenticate + requireRole('organizer').
 */
export async function requireOrganizerApproved(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [profile] = await db
      .select({ status: organizerProfiles.status })
      .from(organizerProfiles)
      .where(eq(organizerProfiles.userId, req.user.userId))
      .limit(1);

    if (!profile) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ORGANIZER_NOT_FOUND',
          message: 'Organizer profile not found.',
        },
      });
      return;
    }

    if (profile.status !== 'approved') {
      res.status(403).json({
        success: false,
        error: {
          code: 'ORGANIZER_NOT_APPROVED',
          message: 'Your organizer account has not been approved yet.',
        },
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Blocks suspended users.
 * Must be used AFTER authenticate.
 * Note: suspension is also checked at login; this covers in-flight tokens.
 */
export async function requireNotSuspended(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { users } = await import('../db/schema/index.js');

    const [user] = await db
      .select({ isSuspended: users.isSuspended })
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not found.' },
      });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact support.',
        },
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}