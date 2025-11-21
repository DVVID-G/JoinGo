export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const Errors = {
  unauthorized: () => new HttpError(401, 'UNAUTHORIZED', 'Missing or invalid credentials'),
  forbidden: () => new HttpError(403, 'FORBIDDEN', 'Forbidden'),
  notFound: (msg = 'Resource not found') => new HttpError(404, 'NOT_FOUND', msg),
  badRequest: (msg = 'Bad request') => new HttpError(400, 'BAD_REQUEST', msg),
  conflict: (msg = 'Conflict') => new HttpError(409, 'CONFLICT', msg),
  server: (msg = 'Internal server error') => new HttpError(500, 'SERVER_ERROR', msg)
};
