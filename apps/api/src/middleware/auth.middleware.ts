import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import type { AccessTokenPayload } from '../lib/jwt.js';
import { db } from '../db/index.js';
import { organizerProfiles, users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import type { UserRole } from '@eventhub/types';

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

// INTERNAL HELPERS

//Sends a standardized unauthorized response.
function sendUnauthorized(res: Response, message: string): void {
  res.status(401).json({
    success: false,
    error: { code: 'UNAUTHORIZED', message },
  });
}

// Sends a standardized forbidden response.
function sendForbidden(res: Response, code: string, message: string): void {
  res.status(403).json({
    success: false,
    error: { code, message },
  });
}

// Checks if a user is suspended (used by multiple guards).
async function isUserSuspended(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ isSuspended: users.isSuspended })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.isSuspended ?? false;
}

// PUBLIC MIDDLEWARE

 //Verifies Bearer token and attaches req.user.
 //Returns 401 if missing or invalid.
 
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendUnauthorized(res, 'Authentication required.');
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

    sendUnauthorized(res, message);
  }
}

//Factory: require a specific role (or one of several roles).
//Must be used AFTER authenticate.
export function requireRole(...roles: Array<'attendee' | 'organizer' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required.');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(
        res,
        'FORBIDDEN',
        'You do not have permission to perform this action.'
      );
      return;
    }

    next();
  };
}

 //Ensures the organizer's profile is approved.
 //Must be used AFTER authenticate + requireRole('organizer').
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
      sendForbidden(res, 'ORGANIZER_NOT_FOUND', 'Organizer profile not found.');
      return;
    }

    if (profile.status !== 'approved') {
      sendForbidden(
        res,
        'ORGANIZER_NOT_APPROVED',
        'Your organizer account has not been approved yet.'
      );
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}


// Blocks suspended users.
// Must be used AFTER authenticate.
export async function requireNotSuspended(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isSuspended = await isUserSuspended(req.user.userId);

    if (isSuspended) {
      sendForbidden(
        res,
        'ACCOUNT_SUSPENDED',
        'Your account has been suspended. Please contact support.'
      );
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}