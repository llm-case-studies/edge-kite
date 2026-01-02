# RFC-001: Unified Event Architecture for Edge-Hub Analytics

**Status:** Draft - Request for Comments
**Created:** 2026-01-02
**Authors:** Alex + Claude (Opus 4.5)
**Seeking:** Perspectives from other AIs and humans

---

## Abstract

We are exploring an architecture for collecting and analyzing events across multiple contexts:
- Web analytics (page views, clicks, sessions)
- IoT/Edge events (camera detections, sensor readings)
- Application events (user actions, errors)

A fundamental question has emerged: **Are these really different problems, or are we over-complicating by treating them as separate domains?**

---

## The Confusion

### Position A: "They're Fundamentally Different"

Traditional thinking separates:

| Web Analytics | IoT/Edge Events |
|---------------|-----------------|
| JS tracker in browser | SDK/agent on device |
| Always-online browsers | Often offline devices |
| Lightweight events (~1KB) | Can include blobs (thumbnails, clips) |
| Real-time to server | Batch/sync when connected |
| Purpose-built tools (Umami, GA, Plausible) | Custom solutions or platforms (Countly, Azure IoT) |
| PostgreSQL/ClickHouse backend | Often SQLite/embedded DB at edge |

### Position B: "Events Are Events"

Counter-argument:

```
At the core, EVERYTHING is just:

{
  "timestamp": "2026-01-02T10:30:00Z",
  "source_id": "camera-barn-01" | "browser-session-abc123",
  "event_type": "person_detected" | "page_view",
  "payload": { ... event-specific data ... }
}
```

Both can be:
- Reported over HTTP endpoints
- Stored in the same database
- Visualized in the same dashboard
- Synced using the same mechanisms

Why do we need Umami AND Countly AND custom IoT solutions when they all:
1. Receive events via HTTP
2. Store in a database
3. Provide a dashboard

---

## The Use Case: On-My-Watch

A concrete scenario driving this discussion:

### System Overview
- **Edge nodes:** Farms, ranches, air-gapped offices
- **Hardware:** NVR + tiny ML models analyzing video feeds
- **Events:** Person detected, vehicle detected, animal detected, motion, etc.
- **Connectivity:** Often offline, occasional internet access
- **Users:** Farmers viewing events on phone via local WiFi

### Requirements
1. Local collector at edge (lightweight, survives power loss)
2. Local dashboard (farmer can view events without internet)
3. Optional sync to central hub when connectivity available
4. Web analytics for the On-My-Watch marketing site/dashboard

### The Question
Do we need:
- **Option A:** Umami for web analytics + Custom solution for edge events (two systems)
- **Option B:** One unified event platform that handles both

---

## Existing Tools Examined

### Umami
- **Stack:** Next.js + PostgreSQL
- **Focus:** Web analytics only
- **Edge support:** None (requires PostgreSQL)
- **Verdict:** Great for web, can't do edge/offline

### Countly
- **Stack:** Node.js + MongoDB
- **Focus:** Mobile/web analytics with Edge Server
- **Edge support:** Yes, but Edge Server may be Enterprise-only
- **Verdict:** Closest to unified, but unclear OSS status of Edge component

### Plausible
- **Stack:** Elixir/Phoenix + PostgreSQL + ClickHouse
- **Focus:** Privacy-first web analytics
- **Edge support:** None
- **Verdict:** Heavier than Umami, still web-only

### ObjectBox
- **What it is:** Edge database with sync, NOT an analytics platform
- **Provides:** Storage + sync mechanism
- **Missing:** Tracker, API, dashboard - you'd build these yourself
- **Verdict:** A component, not a solution

### Frigate NVR
- **Stack:** Python + SQLite
- **Focus:** NVR with local AI object detection
- **Edge support:** Designed for it
- **Web analytics:** None
- **Verdict:** Solves edge video events, not web analytics

---

## Open Questions for Discussion

### Q1: Is the separation artificial?

Web analytics tools evolved from marketing/product needs. IoT platforms evolved from industrial/embedded needs. But in 2026, with:
- HTTP everywhere
- SQLite running on microcontrollers
- Browsers going offline-first (PWAs, Service Workers)

...is maintaining separate ecosystems still justified?

### Q2: What ACTUALLY differs?

| Aspect | Web | Edge/IoT | Real difference? |
|--------|-----|----------|------------------|
| Transport | HTTP | HTTP (or MQTT) | Minor |
| Event size | ~1KB | ~1KB to ~1MB (with media) | Yes - media handling |
| Connectivity | Usually online | Often offline | Yes - sync patterns |
| Client | Browser (ephemeral) | Device (persistent) | Yes - identity model |
| Schema | Standard (pageview, session) | Custom per domain | Maybe - flexibility vs convention |

### Q3: Could a unified architecture work?

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED EVENT PLATFORM                       │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Web Tracker │  │ Edge Agent  │  │ Mobile SDK  │  ... more   │
│  │ (JS)        │  │ (Python/Go) │  │ (native)    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Event Ingestion API (HTTP)                 │   │
│  │         POST /events { type, source, payload }          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐       │
│  │ Edge Store │      │ Hub Store  │      │ Media Store│       │
│  │ (SQLite)   │ ───▶ │ (Postgres) │      │ (S3/disk)  │       │
│  └────────────┘ sync └────────────┘      └────────────┘       │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                         │
│                    │    Dashboard    │                         │
│                    │ (unified view)  │                         │
│                    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Q4: What would we lose with unification?

- Specialized optimizations (ClickHouse for time-series aggregations)?
- Domain-specific features (session replay, funnels, heatmaps)?
- Ecosystem maturity (existing integrations, documentation)?

### Q5: What would we gain?

- Single system to deploy and maintain
- Consistent event model across all sources
- Unified dashboard for all event types
- Simpler mental model

---

## Strawman Architecture: "EventHub"

A hypothetical unified platform:

### Core Components

1. **Event Schema**
   ```json
   {
     "id": "uuid",
     "timestamp": "iso8601",
     "source": {
       "type": "browser|device|server|mobile",
       "id": "unique-source-identifier",
       "metadata": {}
     },
     "event": {
       "type": "pageview|click|detection|reading|error|custom",
       "category": "web|iot|app",
       "data": {}
     },
     "context": {
       "geo": {},
       "device": {},
       "session": {}
     }
   }
   ```

2. **Ingestion Layer**
   - HTTP endpoint: `POST /events`
   - Batch endpoint: `POST /events/batch`
   - WebSocket for real-time: `WS /events/stream`

3. **Storage Strategy**
   - **Edge:** SQLite (single file, crash-safe, zero-config)
   - **Hub:** PostgreSQL or ClickHouse (depending on scale)
   - **Media:** Filesystem or S3-compatible

4. **Sync Mechanism**
   - Edge marks events with `synced: false`
   - When online: `SELECT * FROM events WHERE synced = 0`
   - POST to hub, mark as synced
   - Idempotent (uuid-based dedup)

5. **Dashboard**
   - Web UI (could be a PWA for offline edge viewing)
   - Filterable by source type, event type, time range
   - Pluggable visualizations per event category

### Trackers/Agents

1. **Web Tracker (JS)**
   - Lightweight (~1KB)
   - Auto-captures: pageviews, clicks, errors
   - Posts to `/events` endpoint

2. **Edge Agent (Python/Go)**
   - Runs on NVR/Pi/embedded
   - Receives events from ML pipeline
   - Stores in local SQLite
   - Syncs to hub when connected
   - Serves local dashboard

3. **Mobile SDK (future)**
   - Similar to web tracker
   - Offline queuing built-in

---

## Risks and Concerns

1. **NIH Syndrome** - Are we reinventing wheels that already roll fine?
2. **Scope Creep** - Simple idea becomes complex platform
3. **Maintenance Burden** - One custom system vs. multiple maintained OSS tools
4. **Missing Features** - Years of development in existing tools

---

## Request for Comments

We seek perspectives on:

1. **Is the unified model sound?** Or are there fundamental reasons web analytics and IoT events should stay separate?

2. **What are we missing?** Blind spots in our analysis?

3. **Existing solutions?** Is there already a tool that does unified event collection across web and edge?

4. **Build vs. Buy/Adapt?** Should we:
   - Fork/extend an existing tool (Umami + SQLite sync?)
   - Use a composable stack (ObjectBox + custom dashboard?)
   - Build from scratch?
   - Accept multiple tools?

5. **Priorities for On-My-Watch?**
   - Ship fast with separate tools?
   - Invest in unified architecture?

---

## Appendix: Tools Comparison Matrix

| Tool | Web Analytics | Edge/IoT | Offline-First | Self-Hosted | OSS | DB Backend |
|------|:-------------:|:--------:|:-------------:|:-----------:|:---:|------------|
| Google Analytics | ✅ | ❌ | ❌ | ❌ | ❌ | Proprietary |
| Umami | ✅ | ❌ | ❌ | ✅ | ✅ | PostgreSQL |
| Plausible | ✅ | ❌ | ❌ | ✅ | ✅ | PG + ClickHouse |
| Countly | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | MongoDB |
| PostHog | ✅ | ❌ | ❌ | ✅ | ✅ | PG + ClickHouse |
| Matomo | ✅ | ❌ | ❌ | ✅ | ✅ | MySQL |
| Frigate | ❌ | ✅ | ✅ | ✅ | ✅ | SQLite |
| ObjectBox | ❌ | ✅ | ✅ | ✅ | ✅ | ObjectBox |
| Custom | ✅ | ✅ | ✅ | ✅ | ✅ | Any |

Legend: ✅ = Yes | ⚠️ = Partial/Unclear | ❌ = No

---

## How to Contribute

If you're an AI or human reviewing this RFC:

1. Add your comments below in a new section with your identifier
2. Or create a new file: `RFC-001-RESPONSE-{your-name}.md`
3. Be direct - tell us if we're overcomplicating or missing something obvious

---

## Comments

*[This section to be filled by reviewers]*

### [Reviewer Name/AI] - [Date]
*[Comments here]*

---
