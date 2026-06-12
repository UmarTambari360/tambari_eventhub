import type { 
  Request, 
  Response, NextFunction } from 'express';
import { ZodError }        from 'zod';
import { logger }          from '../lib/logger.js';

/**
 * Base class for all operational (expected) errors.
 * These are safe to return to the client.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(422, message, 'VALIDATION_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(409, message, 'CONFLICT');
  }
}

export class UnprocessableError extends AppError {
  constructor(message: string) {
    super(422, message, 'UNPROCESSABLE');
  }
}

/**
 * Global Express error handler.
 * MUST be registered last — after all routes.
 * Never exposes stack traces or internal DB errors to the client.
 */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // --- Zod validation errors ---
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        issues,
      },
    });
    return;
  }

  // --- Known operational errors ---
  if (err instanceof AppError) {
    // Log 5xx as errors, 4xx as warnings
    if (err.statusCode >= 500) {
      logger.error('AppError (5xx)', {
        requestId: req.requestId,
        statusCode: err.statusCode,
        message: err.message,
        stack: err.stack,
      });
    } else {
      logger.warn('AppError (4xx)', {
        requestId: req.requestId,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code ?? 'ERROR',
        message: err.message,
      },
    });
    return;
  }

  // --- Unknown / unexpected errors ---
  // Log full details server-side, return generic message to client
  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}