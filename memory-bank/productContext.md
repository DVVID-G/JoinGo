# Product Context

Why this project exists:
- Enable secure, scalable videoconferencing features for small groups (classrooms, meetings) with focus on privacy and easy integration.

Problems it solves:
- Centralized authentication and user profile management for clients.
- Room creation, join/leave, and real-time signaling for P2P media.
- Persistent chat history and optional AI-driven summaries.

Target users and use-cases:
- Students and instructors needing low-latency group calls.
- Small teams coordinating quick video huddles with text chat and recorded summaries.

User experience goals:
- Minimal friction joining a room with token-based auth.
- Responsive UI for chat and presence (sub-200ms event propagation).
- Clear error messages and consistent API shapes for frontend integration.
# Product Context

## Problem
Remote collaboration needs fast, low overhead video meetings with integrated chat and simple room management without enterprise complexity.

## Solution Approach
Deliver a streamlined backend supporting auth, meeting creation, participant presence, realtime messaging, and peer-to-peer signaling for audio/video with clear upgrade path to more advanced features.

## User Value
- Hosts quickly generate shareable meeting IDs.
- Participants join with minimal friction using existing Firebase auth.
- Persistent chat retained for summaries and audit.
- Lightweight P2P media reduces infrastructure cost (no heavy media server initially).

## Experience Principles
- Fast join: minimal round-trips before entering a room.
- Predictable error messages (uniform JSON) to simplify frontend handling.
- Realistic scalability path (add STUN redundancy, potential later TURN/SFU).
- Transparent state (user camera/mic statuses broadcast quickly <200ms target).

## Key Features Map
1. User Identity: Firebase ID tokens -> profile sync in Firestore.
2. Meetings: create, read, capacity validation, host controls.
3. Chat: realtime broadcast + persistence + summarization.
4. Signaling: Peer ID exchange for mesh audio/video.
5. State Sync: media toggles and presence events.
6. Maintenance: cleanup old meetings.

## Differentiators
- Early integration of AI summarization for chat transcripts.
- Strict TypeScript + validation to reduce runtime defects.
- Soft-delete rather than hard removal enabling later analytics.

## Future Opportunities
- Add TURN servers / SFU for better multi-party video quality.
- Role-based moderation (mute others, lock room).
- Recording and transcription.
- Metrics/observability dashboards.
