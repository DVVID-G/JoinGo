import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpErrors';
import { logger } from '../utils/logger';

/** Central error handler producing uniform JSON structure */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  logger.error('Unexpected error', err);
  return res.status(500).json({ error: { code: 'UNEXPECTED', message: 'Unexpected error' } });
}
