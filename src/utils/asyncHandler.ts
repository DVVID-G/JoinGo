import { Request, Response, NextFunction } from 'express';

/**
 * Wrap an async route handler so rejected promises are forwarded to `next()`.
 * Usage: `router.get('/x', wrapAsync(handler))`
 */
export function wrapAsync(fn: (req: Request, res: Response, next: NextFunction) => any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
