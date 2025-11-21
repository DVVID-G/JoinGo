// Server-side OAuth service removed.
// The project uses client-side Firebase Authentication and the
// protected `POST /api/auth/provider-sync` endpoint to synchronize
// provider profiles into Firestore. This module intentionally throws
// if invoked to signal removal of server-side code-exchange logic.

export async function exchangeCodeForProfile(): Promise<never> {
  throw new Error('Server-side OAuth code-exchange removed. Use client-side Firebase Authentication and POST /api/auth/provider-sync instead.');
}

export default { exchangeCodeForProfile };
