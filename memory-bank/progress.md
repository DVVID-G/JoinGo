# Progress

Last update: 2025-11-28T00:00:00Z

## What works
- Project skeleton and routing established under `src/`.
- `GET /health` implemented and returns 200 OK.
- Basic user profile CRUD implemented and wired to Firestore via `userService`.
- `authMiddleware` exists to parse and validate Firebase tokens (needs full testing with real tokens).
- Postman collection and environment created locally under `postman/` and run with Newman (results in `newman-results.json`).
- Backlog updated to include auth/registration related acceptance criteria.
- Manual registration (`POST /api/auth/register`) and login (`POST /api/auth/login`) implemented and tested locally.
- Account management endpoints added: `POST /api/auth/change-email`, `POST /api/auth/change-password`, and `DELETE /api/users/me?full=true` for Auth deletion.
- Request logging with `morgan` integrated and TypeScript typing fixed for development.

## Recent pivot and completed refactor
- Real-time responsibilities moved to the `eisc-chat` microservice (port `3001`). Backend acts as a client to `eisc-chat` and persists messages in Firestore.
- `eisc-chat` implements `joinRoom(meetingId)` semantics, emits `chat:message` events per room, and enforces handshake auth: either `CHAT_SERVICE_TOKEN` (server→server) or Firebase ID tokens verified with `firebase-admin`.
- Backend added `src/realtime/chatClient.ts` which connects to `eisc-chat`, listens for `chat:message`, and persists messages to `meetings/{meetingId}/messages` via `messageService.saveMessage`.
- `CHAT_SERVICE_TOKEN` was generated and added to both `JoinGo-backend/.env` and `eisc-chat/.env` for local server→server authentication testing.
- Masked logging was added to both services to help debug token mismatches (logs show masked prefixes/suffixes only).

## What doesn't work yet / blockers
- `connect_error: unauthorized` was observed while connecting the backend chat client to `eisc-chat`. Typical causes: environment not reloaded after `.env` edits, token quoting/escaping issues, or the service not reading the updated env.
- `GET /api/meetings/:id/messages` endpoint (REST) is not implemented — clients currently rely on backend/chatClient to persist messages, but history retrieval must be added.
- Additional TypeScript build/run verification required after changes (some TS issues were fixed, but dev processes must be restarted to confirm a clean `npm run dev`).

## Known issues & risks
- Ensure `CHAT_SERVICE_TOKEN` has no extra quotes or trailing whitespace when written into `.env` files; these cause handshake failures. Masked logs help compare tokens.
- Do not commit the service token to repository in production; use secret management.
- Scaling `eisc-chat` needs Socket.IO adapter (Redis) to coordinate rooms across instances; this is not implemented yet.

## Next milestones / immediate tasks
1. Restart both `eisc-chat` and backend, capture masked token log lines from each service, and compare to validate token equality (look for masking fragments like `aa...zz`). If fragments differ, inspect `.env` for quotes/escape sequences.
2. Implement `GET /api/meetings/:id/messages` in backend to expose persisted chat history to clients.
3. Add a small integration test that sends a `chat:message` through `eisc-chat` and asserts Firestore save via backend chat client (mock Firestore or use test credentials).
4. Plan production readiness: introduce Redis adapter for Socket.IO, centralize secrets, add monitoring and rate-limiting for chat events.

## Progress notes (latest)
- 2025-11-28T00:00:00Z — Separated realtime to `eisc-chat` (port 3001). Backend updated to connect as client and persist messages. Handshake auth middleware added to `eisc-chat`. `CHAT_SERVICE_TOKEN` generated and placed in both environments. Masked logging added to help debug `unauthorized` handshake.

## Monitoring
- Verify token equality after any `.env` changes and restart processes.
- After `GET /api/meetings/:id/messages` is implemented, check message pagination and query performance on Firestore.

