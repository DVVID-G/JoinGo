## Videoconference Backend (Sprint 1)

Backend service providing REST API and foundations for real-time signaling. This README documents the available REST endpoints, how the frontend should orchestrate authentication with external providers (Google), and how to run and test the backend locally.

**Quick links**
- Code: `src/`
- Env example: `.env.example`

**Main features**
- Health check endpoint `GET /health`
- Firebase Admin initialization (Auth + Firestore)
- Auth middleware validating Firebase ID tokens (Bearer)
- User profile CRUD (upsert/sync, read, update, soft-delete)
- Provider sync: client-side Firebase sign-in -> `POST /api/auth/provider-sync`
- Optional server-side OAuth code-exchange: `POST /api/auth/oauth`

## Table of Contents
- **Environment**
- **How frontend should authenticate (recommended)**
- **Endpoints**
- **Server-side OAuth (optional)**
- **Local testing (ngrok / localtunnel / mkcert)**
- **Scripts**
- **Troubleshooting**

## Environment (required variables)
Configure required values in a local `.env` file (copy from `.env.example`). Key variables the frontend/backend rely on:

- `PORT` - server port (default `3000`)
- Firebase Admin credentials: either `FIREBASE_CREDENTIALS_JSON_PATH` pointing to a service account JSON, or all three:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (multiline, the project code handles `\\n` replacement)
- `FIREBASE_API_KEY` - **Firebase Web API Key** (Project settings → General → Web API Key). Required by client-side Firebase SDK.
- OAuth (server-side code-exchange, optional):
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `FACEBOOK_APP_ID` (not implemented yet)
  - `FACEBOOK_APP_SECRET` (not implemented yet)
- Optional: `OPENAI_API_KEY`, `SMTP_*` for email sending, `STUN_SERVER_URL` for later WebRTC features.

Always keep `.env` out of source control. Use secrets manager for production.

## How the frontend should authenticate (recommended flow)
We recommend the **client-side Firebase** flow.

Flow (recommended)
1. Enable provider(s) in Firebase Console → Authentication → Sign-in method (e.g. Google).
2. Frontend uses Firebase JS SDK to sign in (popup or redirect).
3. After sign-in the client obtains a Firebase ID token with `await user.getIdToken()`.
4. The client calls the backend protected endpoint `POST /api/auth/provider-sync` with header `Authorization: Bearer <ID_TOKEN>` and optional supplemental profile data.
5. Backend validates the token, fetches provider info from Firebase Auth user record, and upserts `users/{uid}` in Firestore.

Minimal frontend example (already provided as `firebase-google-test.html`):
1. Put your `FIREBASE_API_KEY` in the HTML or let the server inject it.
2. Load the page and press the Sign-in button. The page will call `POST /api/auth/provider-sync` with the ID token.

Notes:
- Use `Authorized domains` in Firebase Console to allow your test origin (add `localhost` for local testing or your tunneling host like `abcd.ngrok.io` or `open-beans-beg.loca.lt`).
- The ID token must be a Firebase ID token (obtained from Firebase SDK), not a Google access token.

## Endpoints — Full Reference

All responses follow the shape: `{ data: ..., error?: ... }` when successful or use the global error handler for standardized error shapes.

### Health
- GET `/health`
  - Response: 200 `{ status: 'ok' }`

### Authentication (Auth routes)
- POST `/api/auth/register`
  - Body: `{ firstName?, lastName?, age?, email, password }`
  - Creates a Firebase Auth user and a Firestore profile. Returns created user object.

- POST `/api/auth/login`
  - Body: `{ email, password }`
  - Signs in via Firebase REST (server-side helper) and returns tokens or session info.

- POST `/api/auth/forgot-password`
  - Body: `{ email }`
  - Returns a password reset link (generated via Firebase Admin or REST helper).

- POST `/api/auth/logout` (protected)
  - Header: `Authorization: Bearer <ID_TOKEN>`
  - Revokes refresh tokens for the current user.

- POST `/api/auth/change-email` (protected)
  - Body: `{ email }` — updates email in Firebase Auth for the authenticated user.

- POST `/api/auth/change-password` (protected)
  - Body: `{ password }` — updates password for the authenticated user.

- POST `/api/auth/provider-sync` (protected)
  - Header: `Authorization: Bearer <ID_TOKEN>`
  - Body (optional supplemental): `{ provider?, displayName?, avatarUrl?, locale?, phoneNumber?, firstName?, lastName?, email? }`
  - Behavior: validates ID token, reads provider info from Firebase Auth user record, merges provider fields with optional supplemental fields, upserts Firestore `users/{uid}`. Returns the upserted user document.

- POST `/api/auth/oauth` (public) — server-side code exchange (optional)
  - Body: `{ provider: 'google' | 'facebook', code: string, redirectUri?: string }`
  - Behavior (Google implemented): exchanges authorization `code` for tokens with Google, fetches profile, creates or links a Firebase Auth user (by email when possible or deterministic provider uid), upserts Firestore `users/{uid}`, and returns `{ customToken, user }`. The client can then call `signInWithCustomToken(customToken)`.

Security notes:
- Protected endpoints require `Authorization: Bearer <ID_TOKEN>` header with a valid Firebase ID token. The `authMiddleware` handles verification.
- The server-side OAuth endpoint requires proper `GOOGLE_CLIENT_ID/SECRET` env vars and registered redirect URIs in Google Cloud Console.

### User (profile) endpoints
- GET `/api/users/me` (protected)
  - Returns the authenticated user's profile from Firestore.

- PUT `/api/users/me` (protected)
  - Body: partial user fields (e.g. `firstName`, `lastName`, `displayName`, `avatarUrl`, `phoneNumber`) — updates Firestore document and may set `profileCompleted:true` when required fields are present.

- DELETE `/api/users/me` (protected)
  - Soft-deletes the user by setting `status: 'deleted'` and `deletedAt`.

## Server-side OAuth (optional) — how it works
- The server exposes `POST /api/auth/oauth` to support a code-exchange flow. This is optional — the recommended flow is client-side Firebase sign-in + `provider-sync`.

Server-side flow summary:
1. User obtains `code` from provider (Google) by hitting the provider authorization URL with client_id and redirect_uri.
2. Client posts `{ provider, code, redirectUri }` to the backend `POST /api/auth/oauth`.
3. Backend exchanges `code` for tokens (access_token & id_token), fetches the user's profile, creates/links a Firebase Auth user and upserts Firestore profile, then returns a Firebase `customToken`.
4. Client calls `signInWithCustomToken(customToken)` to authenticate with Firebase client SDK.

Important: Make sure `redirectUri` used to obtain the `code` matches the one registered in Google Cloud credentials and matches the `redirectUri` sent to the server.

## Local testing — exposing your local server (HTTPS)

Firebase auth popups/handlers often require HTTPS or a trusted origin. For local testing you have two simple approaches:

1) localtunnel (no account)
  - Run your local static server on `3001` (or the port you use):
    ```powershell
    npx http-server . -p 3001
    ```
  - Expose publicly:
    ```powershell
    npx localtunnel --port 3001
    ```
  - The command returns a public HTTPS URL like `https://open-beans-beg.loca.lt`.
  - Add the host (e.g. `open-beans-beg.loca.lt`) to Firebase Console → Authentication → Authorized domains.
  - In Google Cloud Console → Credentials add `https://open-beans-beg.loca.lt/__/auth/handler` as an Authorized Redirect URI if you use server-side code exchange.

2) ngrok (requires account for authtoken)
  - Install and authenticate ngrok, then run `ngrok http 3001`. Add the returned HTTPS host to Firebase Authorized domains.

3) mkcert and local HTTPS (fully local)
  - Create local TLS certs with `mkcert` and run an HTTPS Express server on `https://localhost:3001`.
  - Add `localhost` to Firebase Authorized domains and register `https://localhost:3001/__/auth/handler` in Google Cloud for server-side flow.

## Scripts
- `npm run dev` — start in development (ts-node/ts-node-dev)
- `npm start` — run compiled JS
- `npm run build` — compile TypeScript
- `npm test` — run unit tests

## Troubleshooting
- `auth/api-key-not-valid`: ensure `FIREBASE_API_KEY` in the client is the project's Web API Key.
- `auth/unauthorized-domain`: add your host to Firebase Authentication → Authorized domains (use only the host, no `https://` or path).
- `ERR_CONNECTION_REFUSED` for `https://localhost/...`: your browser tried to reach HTTPS on port 443 or the requested HTTPS port but no server was listening — use localtunnel/ngrok or run a local HTTPS server.
- `redirect_uri_mismatch`: ensure the `redirect_uri` used in the provider auth flow matches exactly the one registered in Google Cloud Console.
- `401` when calling protected endpoints: confirm `Authorization: Bearer <ID_TOKEN>` contains a valid Firebase ID token (get via Firebase SDK `user.getIdToken()`), and the backend is initialized with the same Firebase project credentials.

## Development notes & suggestions
- The backend supports both client-side provider-sync and server-side OAuth flows. For simplicity and security prefer client-side Firebase Authentication and call `POST /api/auth/provider-sync` to sync profile data.
- Consider adding small robustness improvements: fallback to decode `id_token` when provider token responses lack `access_token`, match provider entries by `providerId` when multiple exist, and sanitize deterministic UIDs generated from provider UIDs.

If you want, I can update the README with a short example step-by-step for your frontend framework (React / Vue) or add a `docs/` file with screenshots and sample Postman requests.

---

If you want me to also inject `FIREBASE_API_KEY` from the server and serve `firebase-google-test.html` at `http://localhost:3000/firebase-google-test.html`, say so and I will apply the patch to the server to serve the test page with the API key in place.
