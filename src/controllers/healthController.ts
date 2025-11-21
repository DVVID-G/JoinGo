import { Request, Response } from 'express';

/** Health check endpoint */
export function getHealth(_req: Request, res: Response) {
  res.json({ status: 'ok' });
}
