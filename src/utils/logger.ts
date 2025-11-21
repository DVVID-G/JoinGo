/** Simple logger wrapper to centralize logging */
export const logger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  // Helper to support writable streams (morgan)
  write: (msg: string) => console.log('[INFO]', msg)
};
