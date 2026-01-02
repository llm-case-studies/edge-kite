# Edge–Hub Event Analytics White Paper

**SPA + Rust API + SQLite at the Edge, Heavy Analytics at the Hub**
**Version:** 0.1 (draft)
**Date:** 2026-01-02

---

## Executive summary

This paper proposes a practical architecture for a **lightweight, offline-first edge analytics system** that feels “Umami-like” in day-to-day use (timeline, charts, top pages/events, health) while delegating resource-intensive and semantics-heavy analytics (sessions, uniques, segmentation, enrichment, long retention) to a **central hub**.

It is motivated by the same tension described in your RFC: web analytics and IoT/edge events *can* share a unified event model, but they diverge in offline requirements, payload size (media), identity models, and analytics/query expectations.  

The core recommendation:

* **Unify the “event envelope” and ingestion/sync mechanics**
* **Separate “derived analytics views” by tier and by where they run**

  * Edge: low-latency, bounded windows, operational truth
  * Hub: correctness-grade analytics, enrichment, long retention

---

## Problem statement

You want:

1. A local “edge dashboard” that works with **no internet**, served as an **SPA** by **nginx**, backed by a **Rust API** and **SQLite**, with small resource usage.
2. A hub that can ingest history and run **heavier analytics** across multiple edge nodes and longer time ranges.
3. A unified experience and data model across web analytics events (pageview/click/error) and IoT/edge events (detections/readings/media references). 

You also want to avoid recreating the “surprise VPS footprint” of tools like Umami, and to use **proven patterns** and **OSS building blocks** where possible.

---

## Goals and non-goals

### Goals

* **Offline-first:** full utility on a LAN without hub connectivity.
* **Small footprint:** predictable CPU/RAM use on modest edge hardware.
* **Durable local ingestion:** tolerate power loss; “append-only” semantics.
* **Deterministic sync:** idempotent, resumable uploads to hub.
* **Unified envelope:** one event contract for all producers (browser/device/server).
* **Tiered analytics:** edge gives fast “what happened recently”; hub gives deep “why/how often, by segment”.

### Non-goals

* Reproducing every Umami feature on the edge (sessions/uniques/geo/device breakdown) at correctness-grade.
* Building a full-blown observability suite (logs/metrics/traces) in v1, though the design should not prevent it.
* Storing large media blobs inside SQLite (store out-of-band and reference).

---

## Architectural overview

### Edge node

**Components**

* **nginx:** serves SPA static assets; reverse-proxy to Rust API.
* **SPA UI:** dashboard + timeline + health + sync status.
* **Rust API service:**

  * ingestion endpoints (`POST /events`, `POST /events/batch`)
  * query endpoints for UI
  * health + device status
  * sync worker to hub (outbox)
* **SQLite:** authoritative local store (events + outbox + optional rollups/sketches).
* **Media store:** filesystem (or optional S3-compatible gateway) for thumbnails/clips; events reference media by URI.

**Why SQLite at the edge**
SQLite is widely used for embedded/edge systems and is explicitly positioned as thriving in “edge of the network” scenarios with intermittent connectivity.
It also has the practical “one file, zero config” advantage described in your RFC’s strawman. 

### Hub

**Components**

* Ingestion API with deduplication/idempotency
* Storage optimized for long retention and aggregation (Postgres/ClickHouse or similar)
* Enrichment workers (UA parsing, bot filtering, geo lookup) as needed
* Analytics materialization (rollups, segments, derived metrics)
* Multi-user auth/RBAC + audit logging
* Object storage for media (if hub also stores clips)

**Key hub advantage**
The hub is where you can:

* change definitions (e.g., “visit” semantics),
* reprocess history,
* run expensive queries,
* and keep “truth metrics” consistent across devices.

---

## Unified event contract

A unified envelope keeps producers simple and unlocks consistent ingestion and sync.

### Recommended envelope fields

```json
{
  "event_id": "uuid",
  "observed_at": "2026-01-02T10:30:00Z",
  "received_at": "2026-01-02T10:30:02Z",
  "source": {
    "type": "browser|edge_device|server|mobile",
    "id": "camera-barn-01",
    "version": "fw-1.2.3",
    "metadata": { "site_id": "farm-17" }
  },
  "event": {
    "category": "web|iot|app|ops",
    "type": "page_view|click|person_detected|reading|error|heartbeat",
    "severity": "debug|info|warn|error|critical",
    "schema_version": "1.0",
    "data": { }
  },
  "correlation": {
    "correlation_id": "uuid",
    "session_id": "optional",
    "incident_id": "optional"
  },
  "attachments": [
    { "kind": "thumbnail", "uri": "file:///media/clip123.jpg", "sha256": "..." }
  ],
  "privacy": {
    "pii": false,
    "retention_class": "short|standard|long"
  }
}
```

### Why distinguish `observed_at` and `received_at`

* Edge devices can drift in clock time.
* Sync can delay delivery.
* Having both timestamps prevents confusing graphs and ordering.

---

## Feature tiers

This section is the “contract” that keeps the edge system lightweight and determines what belongs on the hub.

### Tier 0: Collector and timeline

**Edge implements**

* Ingest: `POST /events`, `POST /events/batch`
* Durable store: append-only events in SQLite
* Timeline UI: list + filters by time/type/source
* Attachments: store media out-of-band; show preview links

**Hub implements**

* Accept uploads; dedup by `event_id`
* Store raw events and attachments metadata

**Why this is valuable**
Tier 0 is already a complete offline product: “What happened? Show me.”

---

### Tier 1: Lightweight local analytics

**Edge implements**

* “Overview” counters for bounded windows (last 24h / 7d)
* Time buckets (hour/day) for event counts
* Top-N lists: pages, referrers (raw), event types, sources, errors
* Basic alert inbox: “new critical events since last view”
* Ops/health dashboard: heartbeats, disk usage, last sync, backlog size

**Hub implements**

* Same metrics across longer windows
* Cross-edge rollups and comparisons

**Why this stays cheap**
All Tier 1 queries are:

* bounded in time,
* mostly `COUNT(*)`, `GROUP BY`, `ORDER BY count DESC`,
* and can be fast with 2–3 indexes and/or a small rollup table.

---

### Tier 2: Edge “nice-to-have” analytics

Tier 2 is where you add features that improve UX while still avoiding correctness traps.

**Edge implements**

* Incremental rollups (e.g., `hourly_counts`)
* Approximate unique counts via sketches (optional)
* Simple UTM/referrer breakdowns (raw, not “attribution models”)
* Local “incident” aggregation for IoT detections (e.g., motion → incident window)

**Hub implements**

* Merge sketches or recompute uniques from raw
* Attribution models, segmentation, cohort-style analytics

**Notes on uniques**
Distinct counts can be expensive; sketching patterns like HyperLogLog give bounded memory and mergeability, making it suitable for edge “estimates.”

---

### Tier 3: Full analytics semantics

Tier 3 is where complexity explodes and the edge stops being “light.”

**Strong recommendation:** do Tier 3 on the hub only.

**Hub implements**

* sessions/visits/visitors semantics
* bounce rate, duration, funnels/cohorts (if you go there)
* multi-dimensional segmentation (country + device + campaign + page)
* UA parsing, bot filtering, geo enrichment
* scheduled reports and org/user management

**Why not on edge**

* Definitions change and require backfills
* Enrichment requires frequent updates (UA patterns, bot lists, GeoIP databases)
* Correctness disputes become inevitable if edge and hub differ

If you want Umami-like semantics, the hub can directly follow Umami’s published definitions (and even reuse its MIT-licensed code where appropriate).

---

## What goes where

A practical decision table:

| Capability                      | Edge | Hub | Notes                                       |
| ------------------------------- | ---: | --: | ------------------------------------------- |
| Timeline, filters, drill-down   |    ✅ |   ✅ | Edge: bounded retention; Hub: global search |
| Counts by time/type/source      |    ✅ |   ✅ | Edge: last 7–30 days; Hub: long-term        |
| Top pages/referrers/events      |    ✅ |   ✅ | Edge: raw referrer; Hub: normalized models  |
| Health and sync status          |    ✅ |   ✅ | Edge is the source of truth                 |
| Approx uniques                  |   ⚠️ |   ✅ | Edge: sketches; Hub: truth                  |
| Sessions/visits/bounce/duration |    ❌ |   ✅ | Avoid edge correctness burden               |
| UA parsing, bot filtering, geo  |    ❌ |   ✅ | Enrichment belongs centrally                |
| Multi-tenant auth/RBAC/audit    |    ❌ |   ✅ | Edge: single-tenant local login             |

---

## Proven OSS patterns and recommended libraries

This section focuses on patterns you can adopt rather than invent.

### Pattern: Transactional outbox for reliable sync

**Concept**

* On edge, treat SQLite as the “source of truth.”
* Store outgoing sync items in the same DB as events.
* A background worker uploads unsynced rows; hub dedups by UUID.

This matches your RFC’s strawman sync mechanism (`synced: false → true`) and keeps sync robust under outages. 

**MIT OSS options**

* `outbox-pattern-processor` (MIT): outbox processing to sinks
* `mailroom` (MIT): Rust library with outbox abstractions/backends

### Pattern: Sketches for “unique” counts

**When to use**

* Edge UI wants “unique visitors (estimate)” without expensive `COUNT(DISTINCT ...)`.

**MIT OSS options**

* `hyperloglog-rs` (MIT)
* `nano-hyperloglog` (MIT)
* `hyperloglogplus` (MIT)

### Pattern: UA parsing as enrichment

**Recommendation**

* Store raw `user_agent` on edge.
* Parse and normalize on hub (so parsers can be updated centrally).

**MIT OSS**

* `uaparser-rs` is MIT-licensed.

**Important licensing note**
Many UA parsing systems rely on the shared `uap-core` regex database, which is Apache-2.0 (not MIT).
If you require “MIT-only” for all artifacts, you’ll need to manage that dependency decision explicitly.

### Pattern: Bot detection lists

**Recommendation**

* Hub-only by default; edge can optionally tag obvious bots.
* Keep the list updateable without firmware redeploys if possible.

**MIT OSS**

* `arcjet/well-known-bots` (MIT)
* `monperrus/crawler-user-agents` (MIT)

### Core embedded data store

* `rusqlite` is MIT-licensed.
* SQLite is a natural fit for edge/offline systems.

### License attribution tooling

To keep compliance easy as dependencies evolve:

* `cargo-about` (Apache-2.0 OR MIT) generates attribution listings.
* `cargo-deny` can enforce license allowlists and flag changes.
* Datadog’s `rust-license-tool` is MIT and generates third-party license outputs.

---

## Expected edge footprint

These are realistic expectations for a carefully scoped Tier 0–2 edge system.

### Baseline RAM

A well-designed edge stack can keep memory small because:

* SQLite’s default suggested cache size is roughly **~2 MB** (implementation-dependent but documented as the default “suggested” cache setting).
* nginx defaults include small request/connection pools (per documentation defaults).

**Typical ranges**

* **Tier 0–1 edge:** ~30–120 MB RAM total (nginx + Rust API + SQLite cache + buffers)
* **Tier 2 (rollups + sketches):** add ~5–30 MB depending on caches and query sizes

Where you can accidentally inflate RAM:

* too many simultaneous SQLite connections
* large in-memory query results (no pagination)
* server-side caching without bounds

### CPU

**Tier 0–1**

* Near idle most of the time on typical edge workloads
* Spikes on ingest bursts, rollup updates, and UI queries

**Tier 2**

* Small additional CPU if you update rollups/sketches on every insert

### Disk and retention

Disk is dominated by two very different things:

1. **SQLite event store**
2. **Media blobs** (thumbnails/clips), which usually dwarf event rows

**SQLite sizing**
Use a simple sizing model:

```
DB size ≈ events_per_day × avg_bytes_per_event × index_multiplier × retention_days
```

If you keep the edge “light,” the operational knob is retention:

* 7–30 days of events locally
* media retention separately, often much shorter or heavily compressed

### WAL behavior

If you use SQLite WAL mode (recommended for concurrent reads + writes), be aware:

* SQLite auto-checkpoints after the WAL reaches a default threshold of **1000 pages**, and you can also checkpoint manually.

On edge, guard against:

* long-lived UI read transactions that prevent checkpointing
* unbounded WAL file growth under heavy ingest

---

## Why the footprint is lower than “full Umami on the edge”

This approach avoids the main cost centers of full web analytics stacks:

* server-rendered React/Next.js process overhead
* heavyweight OLAP-like aggregations over large retention windows on a general-purpose DB
* continual enrichment and segmentation queries

Instead, edge serves:

* static SPA assets
* bounded-window aggregations and timeline queries
* operational health and sync state

The hub is where you pay the cost—because that’s where the value of “deep analytics” is actually realized.

---

## Hub analytics strategies

### Strategy A: “Hub runs full web analytics tool”

If you want maximum leverage and quick correctness:

* Use a web analytics engine (self-host or custom) on the hub for web-style metrics
* Extend it with your unified envelope or ingest pipeline

Umami is MIT-licensed, so reuse/adaptation is possible with attribution.
(And as noted earlier in your discussions, Umami cloud’s use of ClickHouse is a hint that analytics workloads benefit from an OLAP store. )

### Strategy B: “Hub computes analytics from raw unified events”

Use your unified envelope as the base:

* raw events stored once
* per-domain “views” materialized into rollups
* ability to recompute when definitions change

This is more work but yields a truly unified product story.

---

## Recommended implementation plan

### Phase 1: Tier 0 edge MVP

* Rust API: ingest + timeline query endpoints
* SQLite: `events` table + minimal indexes
* nginx + SPA: timeline UI, event detail view
* Media: store + reference only
* Sync: basic outbox to hub with idempotent UUID dedup

### Phase 2: Tier 1 edge dashboard and ops

* Overview counters + hourly chart (last 24h / 7d)
* Top-N lists
* Health panel (heartbeats, storage, last sync, backlog)
* Pagination everywhere

### Phase 3: Tier 2 rollups and sketches

* Add small rollup table(s)
* Optional HLL sketches for “unique estimate”
* Improve sync: batching, compression, resumability, partial acks

### Phase 4: Hub “truth analytics”

* Enrichment workers (UA parsing, bot filtering)
* Sessionization and derived metrics (hub-only)
* Long retention storage and optimized query paths
* RBAC and audit

---

## Reference SQLite schema sketch

Not prescriptive, but illustrates a low-footprint design:

```sql
-- Core events (append-only)
CREATE TABLE events (
  event_id TEXT PRIMARY KEY,
  observed_at INTEGER NOT NULL,   -- unix ms
  received_at INTEGER NOT NULL,   -- unix ms
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  correlation_id TEXT,
  payload_json TEXT NOT NULL,
  attachments_json TEXT,
  pii INTEGER NOT NULL DEFAULT 0,
  retention_class TEXT NOT NULL DEFAULT 'standard',
  synced INTEGER NOT NULL DEFAULT 0
);

-- Indexes for Tier 0/1 queries
CREATE INDEX idx_events_time ON events(observed_at);
CREATE INDEX idx_events_type_time ON events(type, observed_at);
CREATE INDEX idx_events_source_time ON events(source_id, observed_at);
CREATE INDEX idx_events_synced_time ON events(synced, observed_at);
```

For Tier 2 rollups:

```sql
CREATE TABLE hourly_counts (
  hour_bucket INTEGER NOT NULL, -- unix hour
  source_id TEXT NOT NULL,
  type TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (hour_bucket, source_id, type)
);
```

---

## Security, privacy, and governance

### Edge

* Local-first access; optional pairing for phone access
* Minimal PII collection; tag events with `pii` and `retention_class`
* Encrypt secrets at rest where feasible (device keys)
* Expose sync and export actions in an audit-friendly way (even locally)

### Hub

* Strong RBAC and audit logging
* Data retention policies by class
* Idempotent ingest and replay-safe pipeline

---

## Risks and mitigations

### Risk: “We end up rebuilding Umami”

**Mitigation:** lock in the tier boundary; keep Tier 3 hub-only.

### Risk: “Numbers don’t match between edge and hub”

**Mitigation:**

* label edge uniques as estimates (if shown at all)
* compute truth metrics only at hub
* optionally provide a “hub-connected mode” in the edge UI where hub truth replaces local estimates

### Risk: “SQLite contention”

**Mitigation:**

* single writer pattern
* short transactions
* WAL mode and careful query/pagination
* bounded indexes

### Risk: “Sync complexity grows”

**Mitigation:** adopt outbox pattern early and keep it boring: idempotency + retries + batching.

---

## When this is worth the effort

This architecture is especially worth it when:

* offline/LAN-only operation is a core requirement (as in your On-My-Watch scenario) 
* edge hardware is constrained and must stay stable
* you want a unified event model across web + edge + app without running heavyweight analytics stacks everywhere

If you are always online and only need marketing analytics, hub-only solutions with a thin forwarder will be cheaper.

---

## Appendix: MIT attribution template

If you vendor MIT OSS code (not just depend on it), include the license text and a NOTICE entry:

```text
This product includes software from the Umami project (MIT License).
Copyright (c) Umami contributors.
License: MIT.

This product includes software from hyperloglog-rs (MIT License).
Copyright (c) the respective contributors.
License: MIT.
```

(For MIT: preserve the copyright + permission notice.)

---

## Next steps

If you want, I can produce a companion “implementation blueprint” with:

* concrete API routes (edge + hub)
* an explicit sync protocol (batching, acks, resume tokens)
* a minimal SPA screen map per tier
* a performance test plan (event rates, query latency targets, WAL checkpoint checks)
* “definition contract” for hub truth metrics (especially if you want Umami-like semantics)

And if you later decide you do want a PDF, converting this markdown into a clean PDF is straightforward—but the markdown above is designed to stand on its own.

