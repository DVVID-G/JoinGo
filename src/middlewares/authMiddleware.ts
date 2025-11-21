import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
import { Errors } from '../utils/httpErrors';

export interface AuthenticatedRequest extends Request {
  user?: { uid: string; email?: string };
}

/**
 * Auth middleware validating Firebase ID Token from Authorization header.
 */
export async function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) throw Errors.unauthorized();
    let token = header.substring('Bearer '.length).trim();
    // Strip optional surrounding quotes that some clients include
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      token = token.substring(1, token.length - 1);
    }
    const auth = firebaseAuth();
    if (!auth) throw Errors.server('Auth service unavailable');
    let decoded;
    try {
      decoded = await auth.verifyIdToken(token);
    } catch (e) {
      // Map Firebase token decode errors to unauthorized for consistent responses
      // eslint-disable-next-line no-console
      console.error('[authMiddleware] token verification error:', e);
      throw Errors.unauthorized();
    }
    req.user = { uid: decoded.uid, email: decoded.email };
    return next();
  } catch (err) {
    return next(err);
  }
}
