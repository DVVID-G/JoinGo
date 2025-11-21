# Active Context

Current focus (high priority):
- Consolidate and close Sprint 1: ensure registration/login (manual) and account management endpoints are stable, then prepare for Sprint 2.
- Start Sprint 2 scaffolding: meetings model, Socket.IO server skeleton, and room capacity rules.

Recent changes (completed since last snapshot):
- Implemented manual auth flows: `POST /api/auth/register` and `POST /api/auth/login` (server-side using Firebase Admin + REST sign-in where appropriate).
- Added protected account management endpoints: `POST /api/auth/change-email`, `POST /api/auth/change-password`.
- Enhanced `DELETE /api/users/me` to accept `?full=true` to remove the user from Firebase Auth and soft-delete the Firestore profile.
- Integrated HTTP request logging with `morgan` routed through `src/utils/logger` and added TypeScript typings/fallback for `morgan`.
- Centralized Zod schemas for controllers and updated controllers to use them.
- Updated `backlog_completo.md` to mark auth and account deletion items as implemented.
 - Implemented provider-sync flow: `POST /api/auth/provider-sync` reads Firebase `userRecord` and upserts an enriched profile in Firestore.
 - Refactored `src/services/userService.ts` to centralize merge/upsert logic: `mergeProfile`, `upsertUser`, `upsertProfileFromProvider` (preserve completed profiles, transactionally safe).

Open design decisions / constraints:
- OAuth provider flows (Google/Facebook) remain pending: require client secret/ID in env and additional server-side handling; left for a later sprint.
- Tests and CI were intentionally omitted per current scope; plan integration tests after feature stabilization.

Next steps:
1. Begin Sprint 2: implement `POST /api/meetings` (create meeting with NanoID/UUID) and `GET /api/meetings/:id` skeletons.
2. Scaffold Socket.IO (`src/realtime/`) with authentication handshake middleware and join/leave events (capacity enforcement).
3. When ready, add OAuth provider support and document required env vars in `.env.example`.

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
