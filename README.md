# Concord

Concord is a real-time collaboration app with two room types: a shared whiteboard and a shared code workspace.  
It is built to demonstrate production-relevant real-time system design: CRDT-based syncing, websocket infrastructure, presence, and multi-user conflict safety.

## Why This Project

This project is aimed at SWE portfolios and recruiter demos where the goal is to prove practical knowledge of:

- Real-time networking with WebSockets
- Conflict-safe state merging with CRDTs (Yjs)
- Multi-user UX (presence, cursors, reconnection, shared tools)
- End-to-end product quality (typed codebase, clean structure, deployable runtime)

## Core Features

### Collaboration model

- Room-based URLs at `/room/[roomId]`
- Automatic room creation on first join
- Workspace-aware room IDs:
- `whiteboard-*` opens whiteboard workspace
- `code-*` opens code workspace
- “Start Collaborating” entry point from home
- Join existing room by ID

### Whiteboard workspace

- Freehand drawing with smooth incremental stroke updates
- Pencil, text, eraser, and pan tools
- Stroke color and stroke width controls
- Eraser modes:
- Partial erase (removes only touched parts)
- Whole stroke erase (removes entire hit stroke)
- Shared draggable text notes with concurrent-safe editing
- Per-user undo/redo using Yjs `UndoManager`
- Zoom and reset view
- Clear board with confirmation
- Export board as:
- PNG
- SVG
- PDF
- JSON (structured board data)

### Code workspace

- Shared collaborative code editor in the same real-time room model
- Live synced code content via Yjs `Y.Text`
- Language selection (including Python, C++, C, JavaScript, TypeScript, Java, Go, Rust, C#, JSON, HTML, CSS, SQL, Markdown, Shell)
- Shared editor metadata (language/theme)
- Download/copy utilities

### Presence, chat, and calling

- Participant identity (randomized user identity + color)
- Live online user list
- Connection status badge (connected/reconnecting/offline)
- Shared room chat
- Audio/video calling using WebRTC with websocket signaling

### Reliability and engineering quality

- Auto reconnect behavior
- CRDT sync resilience under concurrent edits
- Listener/provider cleanup to avoid leaks
- TypeScript across app/server/shared logic
- Next.js App Router architecture with modular hooks/components

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Yjs + `y-websocket`
- Node.js custom server (`ws`) for HTTP + websocket endpoints
- WebRTC for peer media streams

## High-Level Architecture

```text
app/
  page.tsx                  # Start Collaborating + Join
  room/page.tsx             # Join room flow
  room/[roomId]/page.tsx    # Workspace-aware room route
components/
  RoomClient.tsx            # Main room shell
  BoardCanvas.tsx           # Whiteboard rendering + interactions
  CodeCollabPanel.tsx       # Collaborative code editor UI
  LiveCollabPanel.tsx       # Chat + audio/video panel
  Toolbar.tsx               # Whiteboard tools + export controls
hooks/
  useCollaborativeRoom.ts   # Yjs document model + board/code/chat sync
  useRealtimeCollab.ts      # Presence + WebRTC signaling state
  useBoardViewport.ts       # Pan/zoom camera
lib/
  room.ts                   # Room generation + workspace inference
  export.ts                 # PNG/SVG/PDF/JSON export helpers
  yjs/board.ts              # Shared Yjs type definitions/helpers
server/
  app.js                    # Next + websocket server (/yjs + /rtc)
types/
  board.ts                  # Domain types
```

## CRDT Data Model

Each room has a Yjs document with shared structures for board and code data:

- `strokes` (`Y.Map<Y.Map>`) keyed by stroke ID  
  Each stroke stores metadata and a CRDT array of points.
- `notes` (`Y.Map<Y.Map>`) keyed by note ID  
  Each note stores position/metadata and a `Y.Text` body.
- `code-content` (`Y.Text`) for collaborative source code
- `code-meta` (`Y.Map`) for language/theme preferences
- `chat-messages` (`Y.Array`) for shared room chat history

Presence (cursor, name, color, online state) uses Yjs awareness and RTC signaling channels for ephemeral live state.

## Conflict Resolution Strategy

Concord avoids naive last-write-wins state replacement.  
Instead, Yjs CRDT operations merge concurrent updates safely:

- Concurrent drawing appends/merges stroke point updates without clobbering remote edits
- Concurrent note/code edits merge at text-operation level through `Y.Text`
- Undo/redo is origin-scoped per user to preserve collaborative consistency

This ensures two users can draw/type at the same time without destructive overwrites.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in two browser windows and join the same room ID.

## Scripts

- `npm run dev` - start custom Next.js + websocket server in dev mode
- `npm run build` - lint + typecheck + production build
- `npm run start` - run production server
- `npm run lint` - ESLint checks

## Deployment (Fly.io)

This repo is Fly-ready with `Dockerfile` and `fly.toml`.

```bash
fly launch --no-deploy
fly deploy
```

The Node server serves both HTTP and websocket traffic on a single process/port, which maps cleanly to Fly deployment.

## Known Tradeoffs

- Room state is in-memory at runtime; a process restart clears active sessions.
- Whiteboard rendering is canvas-based without stroke chunk virtualization, so very large boards can require optimization.
- Multi-peer media currently prioritizes practical MVP behavior over full SFU-style scaling.

## Practical Next Steps

- Add durable persistence for Yjs updates/snapshots (Redis/Postgres/S3)
- Add auth and role-based room access
- Add richer code editor features (linting, formatting, execution sandbox)
- Improve whiteboard hit-testing and selective object tools
- Add integration tests for cross-client sync and reconnection scenarios
