# EdgeKite Architecture

## Overview

EdgeKite is a tiered event analytics platform with two components:

1. **Edge Agent** - Lightweight Rust binary with SQLite, runs on edge devices
2. **Hub** - Central aggregation service for fleet-wide analytics

The core insight driving the architecture:

> **"Unify the envelope and ingestion mechanics, but keep domain-specific views/derived models/dashboards."**

Events from web browsers, IoT devices, and applications share a common schema and sync protocol, but analytics computations are tiered between edge (operational) and hub (analytical).

## Tiered Analytics Model

### What Runs Where

| Capability | Edge | Hub | Notes |
|------------|:----:|:---:|-------|
| Event ingestion | ✅ | ✅ | Both accept events |
| Timeline, filters, drill-down | ✅ | ✅ | Edge: bounded retention |
| Counts by time/type/source | ✅ | ✅ | Edge: last 7-30 days |
| Top pages/referrers/events | ✅ | ✅ | Edge: raw; Hub: normalized |
| Health and sync status | ✅ | ✅ | Edge is source of truth |
| Approx uniques (HLL sketches) | ⚠️ | ✅ | Edge: estimates only |
| Sessions/visits/bounce/duration | ❌ | ✅ | Hub only |
| UA parsing, bot filtering, geo | ❌ | ✅ | Enrichment is centralized |
| Multi-tenant auth/RBAC/audit | ❌ | ✅ | Edge: single-tenant local |

### Tier Definitions

#### Tier 0: Collector + Timeline (Edge MVP)
- Ingest events via HTTP POST
- Store in SQLite (append-only)
- Timeline UI with filters by time/type/source
- Media as references only (no blob storage)
- Basic sync to hub via outbox pattern

#### Tier 1: Lightweight Local Analytics (Edge)
- Overview counters for bounded windows (24h, 7d)
- Hourly/daily time buckets for charts
- Top-N lists: pages, referrers, event types, sources
- Alert inbox: new critical events since last view
- Health dashboard: heartbeats, disk usage, sync status, backlog

#### Tier 2: Rollups + Sketches (Optional Edge)
- Incremental rollup tables (hourly_counts)
- HyperLogLog sketches for approximate uniques
- Simple UTM/referrer breakdowns (raw, not models)
- Incident aggregation for IoT (motion → incident window)

#### Tier 3: Full Analytics (Hub Only)
- Sessions, visitors, bounce rate, duration
- Funnels, cohorts, segmentation
- UA parsing, bot filtering, geo enrichment
- Long retention and historical analysis
- Org/user management, RBAC, audit logging

## Event Schema

All events share a unified envelope based on CloudEvents principles:

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "observed_at": "2026-01-02T10:30:00.000Z",
  "received_at": "2026-01-02T10:30:02.123Z",
  "source": {
    "type": "browser|edge_device|server|mobile",
    "id": "camera-barn-01",
    "version": "1.2.3",
    "metadata": {
      "site_id": "farm-17",
      "firmware": "nvr-2.1.0"
    }
  },
  "event": {
    "category": "web|iot|app|ops|security",
    "type": "page_view|person_detected|heartbeat|error",
    "severity": "debug|info|warn|error|critical",
    "schema_version": "1.0",
    "data": {
      // Event-specific payload
    }
  },
  "correlation": {
    "correlation_id": "uuid",
    "session_id": "optional",
    "incident_id": "optional"
  },
  "attachments": [
    {
      "kind": "thumbnail",
      "uri": "file:///media/events/clip123.jpg",
      "sha256": "abc123...",
      "size_bytes": 45000
    }
  ],
  "privacy": {
    "pii": false,
    "retention_class": "short|standard|long"
  },
  "sync": {
    "synced": false,
    "source_seq": 12345
  }
}
```

### Key Schema Decisions

1. **`observed_at` vs `received_at`**: Edge devices can drift; having both prevents confusing graphs and enables ordering corrections

2. **`source_seq`**: Monotonic sequence per source for ordering when clocks are unreliable

3. **`attachments` as references**: Media stored out-of-band, only URIs and hashes in events

4. **`privacy` tags**: Enable retention policies and PII handling

5. **`sync` tracking**: Outbox pattern support built into schema

## Edge Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  EDGE AGENT                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    HTTP Server                       │   │
│  │  POST /api/events       - Ingest single event       │   │
│  │  POST /api/events/batch - Ingest batch              │   │
│  │  GET  /api/health       - Health check              │   │
│  │  GET  /api/stats        - Get counts/pending sync   │   │
│  │  GET  /api/resources    - CPU/RAM/DB usage          │   │
│  │  GET  /api/timeline     - Query events (TODO)       │   │
│  │  GET  /*                - Serve SPA dashboard       │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Event Processor                    │   │
│  │  - Validate schema                                   │   │
│  │  - Assign received_at                               │   │
│  │  - Generate event_id if missing                     │   │
│  │  - Update rollups (Tier 1+)                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                      SQLite                          │   │
│  │  events          - Main event store                 │   │
│  │  hourly_counts   - Rollup table (Tier 1+)          │   │
│  │  config          - Agent configuration              │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Sync Worker                        │   │
│  │  - SELECT WHERE synced=0                            │   │
│  │  - Batch events                                     │   │
│  │  - POST to hub                                      │   │
│  │  - Mark synced=1 on success                         │   │
│  │  - Retry with backoff on failure                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Media Store                         │   │
│  │  /data/media/     - Thumbnails, clips               │   │
│  │  Separate retention policy                          │   │
│  │  Optional sync (disabled by default)                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### SQLite Schema

```sql
-- Core events table (append-only)
CREATE TABLE events (
    event_id TEXT PRIMARY KEY,
    observed_at INTEGER NOT NULL,      -- Unix milliseconds
    received_at INTEGER NOT NULL,      -- Unix milliseconds
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    source_seq INTEGER,                -- Monotonic per source
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    correlation_id TEXT,
    payload_json TEXT NOT NULL,
    attachments_json TEXT,
    pii INTEGER NOT NULL DEFAULT 0,
    retention_class TEXT NOT NULL DEFAULT 'standard',
    synced INTEGER NOT NULL DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX idx_events_observed ON events(observed_at);
CREATE INDEX idx_events_type_observed ON events(type, observed_at);
CREATE INDEX idx_events_source_observed ON events(source_id, observed_at);
CREATE INDEX idx_events_synced ON events(synced, observed_at);
CREATE INDEX idx_events_category ON events(category, observed_at);

-- Tier 1: Rollup table
CREATE TABLE hourly_counts (
    hour_bucket INTEGER NOT NULL,      -- Unix hour
    source_id TEXT NOT NULL,
    type TEXT NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (hour_bucket, source_id, type)
);

-- Agent configuration
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### Resource Targets

| Metric | Target | Notes |
|--------|--------|-------|
| RAM (Tier 0-1) | <100MB | Including SQLite cache |
| RAM (Tier 2) | <150MB | With rollups and sketches |
| Disk (events) | ~500 bytes/event | Depends on payload size |
| Ingest rate | 1000+ events/sec | Batched transactions |
| Startup time | <2 seconds | Cold start |

## Sync Protocol

### Outbox Pattern

The sync mechanism is intentionally simple and robust:

1. **Write**: Events inserted with `synced=0`
2. **Batch**: Worker selects unsynced events up to batch size (100)
3. **Send**: POST batch to hub as JSON array
4. **Ack**: Hub returns list of accepted event_ids
5. **Mark**: Worker updates `synced=1` for accepted events
6. **Retry**: On failure, exponential backoff (1s, 2s, 4s, 8s... max 5min)

```
Edge                                Hub
  │                                  │
  │  POST /api/ingest/batch          │
  │  [{event1}, {event2}, ...]       │
  │ ─────────────────────────────────>
  │                                  │
  │                                  │ Dedupe by event_id
  │                                  │ Store events
  │                                  │
  │  {"accepted": ["id1", "id2"...]} │
  │ <─────────────────────────────────
  │                                  │
  │  UPDATE synced=1                 │
  │  WHERE event_id IN (...)         │
  │                                  │
```

### Sync Configuration

```toml
[sync]
enabled = true
hub_url = "https://hub.edge-kite.com/api/ingest"
api_key = "ek_..."
batch_size = 100
interval_seconds = 30
retry_max_attempts = 10
retry_base_delay_ms = 1000
```

## Hub Architecture (Future)

```
┌─────────────────────────────────────────────────────────────┐
│  HUB                                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Ingestion API                        │   │
│  │  POST /api/ingest/batch - Accept batches from edges │   │
│  │  Dedupe by event_id                                 │   │
│  │  Rate limiting per edge node                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Enrichment Pipeline                     │   │
│  │  - UA parsing (uaparser)                            │   │
│  │  - Bot detection                                    │   │
│  │  - Geo lookup (GeoIP)                              │   │
│  │  - Session stitching                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Storage                           │   │
│  │  PostgreSQL or ClickHouse                           │   │
│  │  - Raw events                                       │   │
│  │  - Materialized rollups                            │   │
│  │  - Session/visitor tables                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Dashboard                          │   │
│  │  - Fleet overview (all nodes)                       │   │
│  │  - Per-node drill-down                             │   │
│  │  - Unified analytics (sessions, uniques, funnels)  │   │
│  │  - RBAC, audit logging                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Event Categories

### Web Analytics Events
```json
{
  "category": "web",
  "type": "page_view",
  "data": {
    "url": "/blog/post-1",
    "referrer": "https://google.com",
    "title": "My Blog Post",
    "user_agent": "Mozilla/5.0..."
  }
}
```

### IoT Detection Events
```json
{
  "category": "iot",
  "type": "person_detected",
  "data": {
    "camera_id": "barn-cam-01",
    "confidence": 0.94,
    "bbox": {"x": 100, "y": 200, "w": 50, "h": 120}
  },
  "attachments": [
    {"kind": "thumbnail", "uri": "file:///media/det_001.jpg"}
  ]
}
```

### Ops/Health Events
```json
{
  "category": "ops",
  "type": "heartbeat",
  "data": {
    "uptime_seconds": 86400,
    "cpu_percent": 12.5,
    "memory_percent": 45.2,
    "disk_percent": 23.1,
    "event_queue_size": 42
  }
}
```

### Security Events
```json
{
  "category": "security",
  "type": "login_attempt",
  "severity": "warn",
  "data": {
    "username": "admin",
    "success": false,
    "ip": "192.168.1.50",
    "reason": "invalid_password"
  }
}
```

## Critical Design Decisions

### 1. Media as References Only
- **DO NOT** store blobs in SQLite
- Events contain URIs and hashes, not binary data
- Media has separate retention policy
- Media sync is optional and separate from event sync

### 2. Two Truths
- **Edge = Operational Truth**: Raw counts, fast queries, bounded retention
- **Hub = Analytical Truth**: Enriched, deduplicated, sessionized

Users must understand these may not match 100%. UI should clearly label which view they're seeing.

### 3. SQLite Performance
- Use WAL mode for concurrent reads/writes
- Batch inserts (not 1 transaction per event)
- Batch syncs (not 1 HTTP request per event)
- Bounded indexes (by time range)
- Periodic VACUUM during low-traffic periods

### 4. Clock Handling
- Store both `observed_at` and `received_at`
- Use `source_seq` for ordering when clocks are unreliable
- Hub applies "timestamp sanity" rules for wildly late events
- Consider bucketing by `received_at` for some views

## Security Considerations

### Edge
- Local-first access (no auth required on LAN by default)
- Optional API key for remote access
- Minimal PII collection
- Encryption of secrets at rest

### Hub
- API key authentication for edge nodes
- RBAC for dashboard users
- Audit logging for all access
- TLS required for all connections

### Sync
- HTTPS only
- API key in Authorization header
- Idempotent operations (safe to retry)
- No sensitive data in URLs

## Future Considerations

1. **WebSocket streaming** for real-time dashboard updates
2. **Edge-to-edge sync** for mesh deployments
3. **ClickHouse on hub** for high-scale analytics
4. **Mobile SDKs** for native app tracking
5. **Alert rules engine** on edge for local notifications
