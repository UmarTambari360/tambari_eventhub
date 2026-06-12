import type { 
  Request, 
  Response, NextFunction } from 'express';
import type { ZodSchema }  from 'zod';

/**
 * Validates req.body against the provided Zod schema.
 * On failure, passes a ZodError to the global error handler.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}