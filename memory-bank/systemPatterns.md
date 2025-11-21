# System Patterns

Architecture overview:
- Monolithic Node.js + TypeScript service exposing REST endpoints and planned Socket.IO real-time layer.
- Firestore (Firebase) used as primary persistence; Firebase Auth for authentication/identity.

Key technical decisions & patterns:
- Thin controllers that delegate to services; services perform Firestore operations and thrown HttpErrors.
- Middleware for authentication (`authMiddleware`) that validates Firebase ID tokens and attaches `req.user`.
- Validation via Zod in controllers before passing to services.
- Error handling centralized via `errorHandler` to return consistent `{ error: { code, message } }` shapes.
- Soft deletes for user and meeting resources (set `status: 'deleted'` and `deletedAt`).

Component relationships:
- `routes/*` -> `controllers/*` -> `services/*` -> `models/*` -> Firestore.
- `utils/` holds `logger`, `httpErrors`, and `validate` helpers.

Operational patterns:
- Timestamps stored as ISO strings (`new Date().toISOString()`).
- Batch/parallelize Firestore operations when iterating to avoid N+1 problems.
- Use env var wrappers via `config/env.ts` instead of direct `process.env` access.
# System Patterns

## Layered Architecture
- Controllers: translate HTTP/Sockets <-> service calls; no business logic.
- Services: pure business + Firestore interactions; throw typed HttpErrors.
- Middlewares: auth, error handling; isolation of cross-cutting concerns.
- Models: TypeScript interfaces representing domain entities (User, Meeting, ChatMessage upcoming).
- Utils: shared helpers (logger, validation, error factories).

## Data Persistence
- Firestore collections: `users`, planned `meetings`, subcollections `meetings/{id}/chat`.
- Soft delete strategy: set `status: 'deleted'` and `deletedAt` timestamp.
- Timestamps standardized with ISO strings via `new Date().toISOString()`.

## Error Handling
- Central `errorHandler` produces `{ error: { code, message } }`.
- Services throw `Errors.*()` factories; controllers avoid manual status codes.

## Validation
- Zod schemas colocated in controllers (e.g., userController) -> `validate()` helper merges messages.
- Every mutating endpoint MUST validate input before service call.

## Authentication Pattern
- Firebase ID Token from `Authorization: Bearer <token>` -> `authMiddleware` verifies & injects `req.user`.
- No re-validation inside services; trust middleware.

## Realtime Strategy (Planned)
- Socket.IO server manages rooms keyed by meeting ID; capacity enforced (<=10).
- PeerJS used only for signaling Peer IDs; events: `user-connected`, `user-disconnected`.
- Event payloads typed in future `src/realtime/events.ts`.

## AI Summarization Flow (Planned)
1. Meeting close endpoint triggers summary job.
2. Fetch chat messages from Firestore subcollection.
3. Call external AI (OpenAI) with bounded prompt length.
4. Persist summary in `summaries` collection.

## Configuration Management
- `config/env.ts` wrapper for env access; newline fix for Firebase private key once.
- All new config keys added to `.env.example` and `config` object.

## Capacity & Cleanup
- Room capacity check at join time (Socket.IO handler).
- Cleanup job scans meetings older than 24h `status: active` -> finalize.

## Extensibility Points
- Add `realtime/` folder for socket handlers.
- Introduce `schemas/` if validation complexity grows.
- Replace simple logger with structured (pino/winston) in robustness sprint.

## Anti-Patterns Avoided
- Direct Firestore calls in controllers.
- Mixed response shapes.
- Silent failures; all errors surfaced through HttpError.
- Business logic leakage into route files.
