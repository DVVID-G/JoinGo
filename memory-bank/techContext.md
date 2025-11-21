# Technical Context

Primary stack and libs:
- Node.js (>=16), TypeScript (strict), Express.
- Firebase Admin SDK (Auth + Firestore).
- Zod for request validation.
- Jest + ts-jest for tests; Supertest for integration tests.
- Socket.IO and PeerJS planned for realtime signaling.

Dev & operational setup:
- `npm run dev` for local development; `npm run build` and `npm start` for production.
- Linting with ESLint and formatting with Prettier (scripts: `lint`, `format`).
- Environment variables managed via `config/env.ts` wrapper; do not use `process.env` directly.

Dependencies of note:
- `firebase-admin` for server-side auth and Firestore.
- `zod` for schemas.
- `newman` for running Postman collections locally when needed.

Testing & CI guidance:
- Unit tests mock Firebase interactions; integration tests use lightweight stubs rather than calling live Firebase.
- Newman used for quick API regression runs; Postman collections stored under `postman/`.
# Tech Context

## Languages & Runtime
- Node.js (CommonJS currently) + TypeScript (strict). Using TS 5.9.3 (ESLint plugin warns >5.6).

## Frameworks & Libraries
- Express for REST endpoints.
- Firebase Admin (Auth + Firestore) for identity & persistence.
- Socket.IO (planned) for realtime room management.
- PeerJS (planned) for WebRTC signaling abstraction.
- Zod for schema validation.
- Jest + ts-jest + supertest for tests.
- nanoid for meeting ID generation (planned).

## Project Tooling
- ESLint (`@typescript-eslint` rules) + Prettier formatting.
- Scripts: `dev` (ts-node), `build` (tsc), `start` (node dist), `lint`, `format`, `test`.
- Jest config in `jest.config.cjs`.

## Environment Variables (.env)
- `PORT` server port.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (newline escaped) for Firebase Admin.
- `STUN_SERVER_URL` planned ICE configuration endpoint.
- `OPENAI_API_KEY` optional for AI summaries.

## Initialization
- `initFirebase()` checks presence of credentials; logs degraded mode if missing.
- Newline fix applied once: `replace(/\\n/g, '\n')`.

## Error & Logging
- Custom `HttpError` with code + status; factories in `httpErrors.ts`.
- Simple console-based logger; upgrade path to structured logging (pino/winston).

## Build & Run
- Development: `npm run dev` (ts-node direct, no hot reload).
- Production: `npm run build` then `npm start`.
- Potential future switch to `tsx` or `nodemon` for improved DX.

## Testing Strategy
- Integration tests spin minimal Express app mounting only relevant routers.
- Firebase interactions to be mocked (not yet implemented) to avoid real external calls.

## Planned Realtime Folder Structure
```
src/realtime/
  server.ts      # Socket.IO initialization
  handlers/      # domain-specific event handlers
  events.ts      # typed event payload definitions
  roomManager.ts # capacity + lifecycle logic
```

## External Service Considerations
- STUN server configuration served via `/api/config/ice-servers` (Sprint 3/4).
- AI summarization call must enforce token & prompt size constraints.
