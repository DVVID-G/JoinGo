# Active Context

Current focus (high priority):
- Consolidate and close Sprint 1: ensure registration/login (manual) and account management endpoints are stable, then prepare for Sprint 2.
- Start Sprint 2 scaffolding: meetings model, Socket.IO server skeleton, and room capacity rules.

Recent pivot (updated):
- The real-time Socket.IO server has been separated into an independent microservice `eisc-chat` (runs on port 3001). The backend (`JoinGo-backend`) no longer hosts the Socket.IO server and now connects as a client to `eisc-chat` to persist chat messages in Firestore.
- `eisc-chat` now supports `joinRoom(meetingId)` semantics and emits `chat:message` per room. It enforces handshake authentication: accepts either a `CHAT_SERVICE_TOKEN` (server→server) or Firebase ID tokens (verified via `firebase-admin`).
- The backend includes a chat client (`src/realtime/chatClient.ts`) that connects to `eisc-chat`, listens for `chat:message` events and persists them to Firestore using `messageService.saveMessage`.
- `eisc-chat` default port changed to `3001` to avoid conflict with the backend's `3000`.
- A shared `CHAT_SERVICE_TOKEN` was generated and added to both environments for server→server auth during testing.

Recent changes (completed since last snapshot):
- Implemented manual auth flows: `POST /api/auth/register` and `POST /api/auth/login` (server-side using Firebase Admin + REST sign-in where appropriate).
- Added protected account management endpoints: `POST /api/auth/change-email`, `POST /api/auth/change-password`.
- Enhanced `DELETE /api/users/me` to accept `?full=true` to remove the user from Firebase Auth and soft-delete the Firestore profile.
- Integrated HTTP request logging with `morgan` routed through `src/utils/logger` and added TypeScript typings/fallback for `morgan`.
- Centralized Zod schemas for controllers and updated controllers to use them.
- Updated `backlog_completo.md` to mark auth and account deletion items as implemented.
 - Implemented provider-sync flow: `POST /api/auth/provider-sync` reads Firebase `userRecord` and upserts an enriched profile in Firestore.
 - Refactored `src/services/userService.ts` to centralize merge/upsert logic: `mergeProfile`, `upsertUser`, `upsertProfileFromProvider` (preserve completed profiles, transactionally safe).

 - Separated real-time responsibilities: removed server-side Socket.IO from backend and added `eisc-chat` microservice.
 - `eisc-chat` implemented rooms (`joinRoom`) and per-room `chat:message` emission; removed ephemeral in-memory history (persistence delegated to backend).
 - Backend implemented `chatClient` that connects to `eisc-chat`, persists messages to Firestore (`meetings/{id}/messages`), and logs masked token usage for debugging.
 - Added handshake auth middleware in `eisc-chat` and masked logging to debug token mismatches.
 - Frontend: patched `useMeetingStore.ts` to add a token fallback and richer fetch logging:
	 - `getClientToken()` now attempts Firebase `auth.currentUser.getIdToken(true)` and falls back to `localStorage.getItem('idToken')` for legacy/email-login flows.
	 - `doFetchWithRetry()` logs token source (firebase/localStorage/none), request headers used, and retries once on 401 before surfacing the error.
	 - Forced auto-logout/`window.location.replace('/login')` on 401 was temporarily disabled to allow in-production debugging; replaced with console warnings.
	 - Removed several hardcoded `http://localhost` fallbacks in the frontend and moved calls to use Vite envs (`VITE_API_URL`, `VITE_CHAT_SERVICE_URL`). A fresh production build is required to ensure no localhost strings remain in `dist`.
 - Inserted `CHAT_SERVICE_TOKEN` into both `JoinGo-backend/.env` and `eisc-chat/.env` for server→server auth during development.

Open design decisions / constraints:
- OAuth provider flows (Google/Facebook) remain pending: require client secret/ID in env and additional server-side handling; left for a later sprint.
- Tests and CI were intentionally omitted per current scope; plan integration tests after feature stabilization.

Next steps:
1. Begin Sprint 2: implement `POST /api/meetings` (create meeting with NanoID/UUID) and `GET /api/meetings/:id` skeletons.
2. Scaffold Socket.IO (`src/realtime/`) with authentication handshake middleware and join/leave events (capacity enforcement).
3. When ready, add OAuth provider support and document required env vars in `.env.example`.

Updated next steps (post-refactor):
4. Add `GET /api/meetings/:id/messages` endpoint in backend to return persisted chat history from Firestore (client-friendly histogram retrieval).
5. Implement optional behavior: when a client calls `joinRoom` on `eisc-chat`, backend (as client) may respond by emitting `messages:history` to that room after fetching persisted messages — choose either server-initiated push or client-side REST fetch (recommended REST for simplicity).
6. For production scaling: adopt Socket.IO Redis adapter for `eisc-chat` and consider rate limits / capacity enforcement using a centralized store (Redis/Firestore transactions).

4. Document provider-sync behaviour and add Postman examples: show `POST /api/auth/provider-sync` request (Bearer idToken) and `PUT /api/users/me` example to complete profile and set `profileCompleted:true`.
 
## Provider-sync Example (Client-side Firebase flow)

Client-side steps:

- Enable provider in Firebase Console (Authentication -> Sign-in method).
- On the client, sign in using Firebase JS SDK (signInWithPopup/signInWithRedirect).
- Retrieve the Firebase ID token via `user.getIdToken()` and call the backend:

```
POST /api/auth/provider-sync
Headers: Authorization: Bearer <ID_TOKEN>
Body (optional): { "displayName": "Ana Perez", "avatarUrl": "https://..." }
```

Server behaviour:

- Verifies ID token via Firebase Admin SDK.
- Extracts available profile fields from `auth.getUser(uid)` and merges with optional client payload.
- Creates/updates `users/{uid}` with provider metadata and sets `profileCompleted` if required fields present.

Client completes profile example:

```
PUT /api/users/me
Headers: Authorization: Bearer <ID_TOKEN>
Body: { "firstName": "Ana", "lastName": "Perez", "email": "ana@example.com" }
```

After successful update, `profileCompleted` will be `true` if required fields are present.

## Current Sprint Status
- Sprint 1: core features implemented (health, user CRUD, manual auth flows, account management). Remaining Sprint 1 items narrowed to OAuth provider flows and optional email SMTP delivery for password reset.

## Recent operational/debugging notes (2025-11-28)
- Browser repro showed `GET|POST /api/meetings` returning 401 while `POST /api/auth/login` and `GET /api/users/me` succeeded. Investigation found the client did not attach `Authorization: Bearer <idToken>` to meetings requests.
- Temporary mitigation: frontend meeting store now uses a token fallback (Firebase -> `localStorage.idToken`) and disables forced auto-logout to allow capture of failing requests and validation in production.
- Required follow-ups: persist `idToken` on successful backend `POST /api/auth/login` (frontend login handler must `localStorage.setItem('idToken', idToken)`), rebuild frontend with correct Vite env vars, and capture DevTools Network request/cURL for one failing `/api/meetings` request to confirm headers and CORS.

## Immediate Next Steps
- Implement meetings controller/service and Socket.IO scaffold.
- Prepare integration plan for OAuth providers (credential requirements documented in `.env.example`).

## Decisions Made
- Kept CommonJS module target for dev compatibility with `ts-node`.
- Chose soft-delete as default for Firestore documents; `full=true` allows Auth deletion.

## Risks
- OAuth and Postman cloud upload remain manual steps until credentials and exact collection schema are available.

## Short-Term Focus
1. Meetings model + service + controller.
2. Socket.IO join-room + capacity check and auth handshake.
3. Chat message persistence subcollection design.

## Recently Learned
- Morgan integration provides immediate request visibility in logs.
- Firebase provider errors (e.g., `auth/configuration-not-found`) surface when sign-in methods are not enabled; enable Email/Password in Console for manual auth.
