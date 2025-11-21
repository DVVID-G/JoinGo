import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrap async route handlers so thrown/rejected errors are forwarded to Express error handler.
 * Accepts both sync and async handlers (returns void or Promise).
 */
export function asyncHandler(fn: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Normalize handler result to a promise so rejections are caught and forwarded.
    Promise.resolve(fn(req, res, next) as unknown as Promise<any>).catch(next);
  };
}
