import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout, logoutAll } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '@eventhub/validators';

const router = Router();

// ─── Rate limiters ────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many registration attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many refresh attempts. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: (process.env['NODE_ENV'] === 'production' ? 'none' : 'strict') as
    | 'none'
    | 'strict',
  path: '/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
} as const;

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    path: '/auth',
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 */
router.post(
  '/register',
  registerLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, tokens } = await register(req.body as {
        email: string;
        password: string;
        fullName: string;
        phoneNumber?: string;
      });

      setRefreshCookie(res, tokens.refreshToken);

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /auth/login
 */
router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, tokens } = await login(req.body as {
        email: string;
        password: string;
      });

      setRefreshCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /auth/refresh
 * Reads refresh token from httpOnly cookie, returns new access token.
 */
router.post(
  '/refresh',
  refreshLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies[COOKIE_NAME] as string | undefined;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided.' },
        });
        return;
      }

      const { user, tokens } = await refresh(refreshToken);

      setRefreshCookie(res, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /auth/logout
 * Requires valid access token. Blacklists it + revokes refresh token.
 */
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : '';

      const refreshToken = req.cookies[COOKIE_NAME] as string | undefined;

      await logout(accessToken, refreshToken);

      clearRefreshCookie(res);

      res.status(200).json({ success: true, data: { message: 'Logged out successfully.' } });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /auth/logout-all
 * Revokes all refresh token families for the user.
 */
router.post(
  '/logout-all',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : '';

      await logoutAll(req.user.userId, accessToken);

      clearRefreshCookie(res);

      res.status(200).json({
        success: true,
        data: { message: 'All sessions terminated successfully.' },
      });
    } catch (err) {
      next(err);
    }
  }
);

export { router as authRouter };