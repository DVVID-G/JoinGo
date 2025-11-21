import { Request, Response, NextFunction } from 'express';

/**
 * Wrap async route handlers so thrown/rejected errors are forwarded to Express error handler.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
