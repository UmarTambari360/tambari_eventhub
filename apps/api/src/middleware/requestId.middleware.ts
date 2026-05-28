import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Attaches a unique X-Request-ID to every request.
 * Uses the incoming header if provided (useful for tracing across services),
 * otherwise generates a fresh UUID.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const existing = req.headers['x-request-id'];
  const requestId =
    typeof existing === 'string' && existing.length > 0 ? existing : uuidv4();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}