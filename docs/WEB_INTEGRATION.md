# Web Frontend Integration Guide

## Overview

This document describes how the GAIS React prototype (`web/`) is wired to the real EdgeKite Rust backend (`edge/`).

## Current State: ✅ Integrated

### Frontend (web/)
- **Framework:** React 18 + TypeScript + Vite
- **Services:**
  - `api.ts` - HTTP client for EdgeKite API (batched event sending, stats, resources)
  - `tracker.ts` - Captures browser events, optionally sends to API
  - `storage.ts` - Persists preferences to localStorage
  - `gemini.ts` - AI integration for Privacy Airlock

### Backend (edge/)
- **Framework:** Rust + Axum + SQLite
- **Endpoints:**
  - `POST /api/events` - Ingest single event
  - `POST /api/events/batch` - Ingest batch
  - `GET /api/events/recent` - Get recent events (supports `limit`, `category`, `source` params)
  - `GET /api/health` - Health check with version and counts
  - `GET /api/stats` - Event counts, pending sync, source count
  - `GET /api/resources` - CPU/RAM/DB usage

---

## Quick Start: Local Development

### 1. Start the Rust Backend

```bash
cd edge-kite/edge
cargo build --release
./target/release/edge-kite --listen 0.0.0.0:8080 --data-dir ./data
```

Verify it's running:
```bash
curl http://localhost:8080/api/health
# {"status":"ok","version":"0.1.0","event_count":0,"pending_sync":0}
```

### 2. Start the React Frontend

```bash
cd edge-kite/web
npm install
npm run dev
```

Frontend runs on `http://localhost:3080` with API proxy to `:8080`.

### 3. Test Event Flow

```bash
# Send a test event
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{"source":{"type":"browser","id":"test"},"event":{"category":"web","type":"page_view","data":{"path":"/"}}}'

# Check it was stored
curl http://localhost:8080/api/events/recent
```

---

## Type Mappings

### Frontend EdgeEvent → Backend IncomingEvent

```typescript
// Frontend (web/types.ts)
interface EdgeEvent {
  id: string;
  timestamp: string;      // "14:32:15"
  category: EventCategory;
  type: string;
  detail: string;
  sourceId: string;
  isVisitor?: boolean;
  meta?: Record<string, any>;
}

// Backend expects (edge/src/event.rs)
interface IncomingEvent {
  event_id?: string;       // Optional, backend generates UUID if missing
  observed_at?: string;    // ISO8601, defaults to now
  source: {
    type: string;          // "browser" | "edge_device" | "server"
    id: string;            // sourceId
    version?: string;
    metadata?: object;
  };
  event: {
    category: string;      // "web" | "iot" | "ops" | "security"
    type: string;          // event type
    severity?: string;     // "info" default
    data: object;          // { detail, meta }
  };
  correlation?: object;
  privacy?: object;
}
```

### Conversion (in api.ts)

```typescript
export function toBackendEvent(e: EdgeEvent): IncomingEvent {
  return {
    event_id: e.id,
    source: {
      type: 'browser',
      id: e.sourceId,
      version: '0.1.0',
      metadata: e.meta || {}
    },
    event: {
      category: e.category,
      type: e.type,
      severity: 'info',
      data: { detail: e.detail, ...(e.meta || {}) }
    },
    privacy: { pii: false, retention_class: 'standard' }
  };
}
```

---

## API Service (web/services/api.ts)

The API service provides:

- **Event Batching**: Events are queued and sent in batches (default: 10 events or 5 seconds)
- **Offline Support**: Events are queued when offline, sent when online
- **Type Safety**: Full TypeScript types for request/response

```typescript
import { api } from './services/api';

// Queue an event (batched sending)
api.queueEvent(edgeEvent);

// Get system stats
const stats = await api.getStats();

// Get recent events
const events = await api.getRecentEvents(100);

// Check API availability
const available = await api.isAvailable();
```

---

## Tracker Integration (web/services/tracker.ts)

The tracker can optionally send events to the API:

```typescript
import { tracker } from './services/tracker';

// Enable API mode (sends events to backend)
tracker.setApiMode(true);

// Check if API is available
if (tracker.isApiAvailable()) {
  console.log('Events will be sent to EdgeKite');
}

// Track an event (goes to both listeners AND API when enabled)
tracker.track('web', 'page_view', '/dashboard');
```

---

## Vite Proxy Configuration

The `vite.config.ts` proxies `/api/*` requests to the backend:

```typescript
export default defineConfig({
  server: {
    port: 3080,
    strictPort: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
});
```

---

## Media Files

NotebookLM outputs are in `web/public/assets/`:

| File | Description | Size |
|------|-------------|------|
| `edgekite_video.mp4` | Deep-dive video | 24MB |
| `edgekite_audio.m4a` | Audio briefing | 26MB |
| `edgekite_infographic.png` | Architecture diagram | 6MB |

These are served at `/assets/*` by Vite in development.

---

## Integration Checklist

- [x] Create `web/services/api.ts` with batched event sending
- [x] Update `web/services/tracker.ts` to optionally send to API
- [x] Configure Vite proxy for `/api/*`
- [x] Add `/api/events/recent` to Rust backend
- [x] Add `get_recent_events()` to Database
- [x] Add `source_count()` to Database
- [x] Copy media files to `web/public/assets/`
- [x] Update DocsPage.tsx media paths
- [ ] Wire Dashboard to use real API instead of mock data
- [ ] Add SSE endpoint for real-time streaming (future)
- [ ] Production build and bundling

---

## Next Steps

1. **Dashboard Integration**: Update `Dashboard.tsx` to fetch real stats from API
2. **Real-time Updates**: Add SSE endpoint and connect to frontend
3. **Production Build**: Bundle frontend for embedding in Rust binary
