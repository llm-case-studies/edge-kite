# Synthesis: AI Feedback on Edge-Hub Analytics RFC

**Date:** 2026-01-02
**Reviewers:** DeepSeek, Grok, GPT-4, Gemini
**Synthesized by:** Claude (Opus 4.5)

---

## Executive Summary

**Verdict: BUILD IT.** All reviewers validated the core concept with strong consensus on architecture and market opportunity.

The key resolution to our "events are events" confusion:

> **"Unify the envelope and ingestion mechanics, but keep domain-specific views/derived models/dashboards."**
> — GPT-4

This is not either/or. Both positions in the RFC are correct, just at different layers.

---

## The Resolution: Layer-Based Unification

| Layer | Unified? | Rationale |
|-------|:--------:|-----------|
| **Event Envelope** | ✅ | CloudEvents-like schema works for all sources |
| **Transport** | ✅ | HTTP POST /events, batching, compression |
| **Auth/Identity** | ✅ | Same policy engine, different credentials (browser token vs device cert) |
| **Sync Protocol** | ✅ | Outbox pattern, idempotent, resumable |
| **Edge Storage** | ✅ | SQLite everywhere |
| **Hub Storage** | ✅ | PostgreSQL or ClickHouse |
| **Derived Models** | ❌ | Web: sessions/funnels. IoT: incidents/timelines. Ops: health |
| **Dashboards** | ❌ | Pluggable modules per domain |
| **Enrichment** | ❌ | Hub-only (UA parsing, geo, bot filtering) |

---

## Validated Architecture: Tiered Edge-Hub

All reviewers endorsed the tiered approach from the GPT Whitepaper:

### Tier 0: Collector + Timeline (Edge MVP)
- Ingest events via HTTP
- Store in SQLite (append-only)
- Timeline UI with filters
- Media as references only

### Tier 1: Lightweight Local Analytics (Edge)
- Counts by time/type/source (bounded windows: 24h, 7d)
- Top-N lists (pages, referrers, event types)
- Health dashboard (heartbeats, disk, sync status)
- Alert inbox

### Tier 2: Rollups + Sketches (Optional Edge)
- Incremental hourly/daily rollups
- HyperLogLog for approximate uniques
- Simple incident aggregation for IoT

### Tier 3: Full Analytics (Hub Only)
- Sessions, visitors, bounce rate, funnels
- UA parsing, bot filtering, geo enrichment
- Multi-dimensional segmentation
- Long retention, RBAC, audit

**Key principle:** Edge shows "Operational Truth" (raw, fast, bounded). Hub shows "Analytical Truth" (corrected, enriched, complete).

---

## Market Validation: "The Missing Middle"

All reviewers identified the same market gap:

| Segment | Problem |
|---------|---------|
| **Too Heavy** | AWS Greengrass, Azure IoT Edge, Prometheus+Grafana stack (500MB+ RAM) |
| **Too Simple** | Raw logs, CSV files, no visualization or sync |
| **Your Target** | Lightweight, offline-first, Umami-like UX, hub sync when available |

### Target Users
- **Farms/ranches** with intermittent connectivity (On-My-Watch scenario)
- **Air-gapped offices** with privacy requirements
- **Maritime/logistics** with satellite-only sync windows
- **MSPs** managing 50+ small sites on Raspberry Pis
- **Self-hosters** wanting local-first with optional federation

### Competitive Landscape
- Web analytics: SATURATED (Umami, Plausible, Fathom, Matomo)
- Enterprise IoT: dominated by heavy stacks
- Lightweight edge observability: **WIDE OPEN**

---

## Tech Stack Consensus

### Edge: Rust + SQLite
- **Single binary** deployment (PocketBase pattern)
- **SQLite in WAL mode** for concurrent reads/writes
- **Target footprint:** <100MB RAM for Tier 0-1
- **SPA served by nginx** or embedded in Rust binary
- **No container orchestration required**

### Hub: Standard Backend
- PostgreSQL or ClickHouse for analytics
- Object storage for media (if synced)
- Standard web framework (doesn't matter as much)

### Sync: Outbox Pattern
```
Edge: INSERT event → mark synced=0
Background: SELECT WHERE synced=0 → batch → POST to hub → mark synced=1
Hub: Dedupe by UUID, store
```

---

## Critical Warnings (All Reviewers Flagged)

### 1. Media Handling is Dangerous
- **DO NOT** store blobs in SQLite
- **DO** store references only (URI + hash)
- **DO** make media sync a separate, optional pipeline
- **DO** have aggressive retention/pruning defaults

### 2. Clock Drift is Real
- Edge devices have unreliable clocks
- Store both `observed_at` (when it happened) and `received_at` (when ingested)
- Add `source_seq` (monotonic per source) for ordering
- Hub needs "timestamp sanity" rules for wildly late events

### 3. Edge Numbers ≠ Hub Numbers
- Users will expect 100% match; they won't get it
- **Label clearly:** "Operational View" vs "Analytical View"
- Edge = raw counts, Hub = corrected/deduplicated truth
- Consider "hub-connected mode" in edge UI that shows hub truth

### 4. SQLite Performance Nuance
- "50k inserts/sec" is only with batched transactions
- Individual transactions: "only a few dozen per second" (SQLite FAQ)
- **Validates your design:** batch inserts, batch syncs, avoid 1-event-per-transaction

---

## Expanded Event Types

GPT-4 provided the most comprehensive list. Add these to your event taxonomy:

### Device Lifecycle Events
- Provisioned / claimed / transferred ownership
- Certificate rotated / key compromised
- Firmware updated / rollback occurred
- Time sync status changed (NTP locked/unlocked)
- Reboot reasons (power loss vs crash vs manual)

### Health/Heartbeat Events
- Heartbeat missed / recovered
- Local DB corruption detected / repaired
- Disk nearing full / retention cleanup started
- Thermal throttling / undervoltage
- Watchdog reset triggered

### Pipeline Integrity Events
- Camera feed lost / FPS dropped / decoder errors
- ML inference latency spike / model load failed
- Detection confidence distribution drift
- Event queue backlog growing
- Sync stuck (auth failed, DNS failed, clock skew rejected)

### Security/Audit Events
- Login attempts, MFA events, password resets
- Permission changes, new admin added
- Export/download of clips
- Local-only access vs remote access
- Tamper events (case opened, camera moved, lens obscured)

### Incident Composition (Derived Events)
- Person detected → "intrusion suspected"
- Multiple sensors corroborate → "intrusion confirmed"
- No presence for N minutes → "all clear"
- Dwell-time logic → "vehicle arrived" vs "vehicle passing"

### UX/Product Events
- Notification delivered/opened
- User acknowledged alert / marked false positive
- Search performed, filters used
- Time-to-first-frame / time-to-clip-load

### Cost/Governance Events
- Clip uploaded size, egress bytes
- Storage retained per camera/day
- CPU/GPU utilization bands
- Battery state (for solar/remote deployments)

---

## Recommended Unified Envelope

Based on GPT's CloudEvents-influenced proposal:

```json
{
  "event_id": "uuid",
  "observed_at": "2026-01-02T10:30:00Z",
  "received_at": "2026-01-02T10:30:02Z",
  "source": {
    "type": "browser|edge_device|server|mobile",
    "id": "camera-barn-01",
    "version": "fw-1.2.3",
    "metadata": {}
  },
  "event": {
    "category": "web|iot|app|ops|security",
    "type": "page_view|person_detected|heartbeat|error",
    "severity": "debug|info|warn|error|critical",
    "schema_version": "1.0",
    "data": {}
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
  },
  "sync": {
    "synced": false,
    "source_seq": 12345
  }
}
```

---

## Business Model Options (Gemini)

### 1. Open Core (Tailscale/Balena model)
- Edge Node: Free, Open Source (MIT)
- Hub SaaS: "5 nodes free, then $X/node"

### 2. Appliance Model (Home Assistant)
- Sell pre-flashed Raspberry Pi / NUC
- "Plug into your cafe's router to track footfall"

### 3. MSP License
- White-label hub for agencies managing 500+ client sites

---

## What NOT to Build (Avoid Scope Creep)

- ❌ Full session/visitor semantics on edge
- ❌ UA parsing / geo lookup on edge
- ❌ Bot filtering on edge
- ❌ Media sync in v1 (references only)
- ❌ Complex funnel/cohort analysis on edge
- ❌ Multi-tenant RBAC on edge
- ❌ LiteFS/Marmot-style distributed replication (wrong tool)

---

## Recommended Next Steps

### Phase 1: Edge MVP (Tier 0)
- Rust API with SQLite
- Ingest endpoint + timeline query
- Minimal SPA (timeline, filters, event detail)
- Basic outbox sync to hub
- Target: <100MB RAM

### Phase 2: Edge Dashboard (Tier 1)
- Hourly counts chart (24h/7d)
- Top-N lists
- Health panel (heartbeats, disk, sync status)
- Pagination everywhere

### Phase 3: Hub Integration
- Hub receives batches, dedups by UUID
- Basic dashboard showing all edge nodes
- Retention and storage policies

### Phase 4: Analytics Features
- Enrichment workers on hub
- Session/visitor calculation (hub only)
- Cross-edge aggregation

---

## References from Reviewers

- [CloudEvents Spec](https://github.com/cloudevents/spec) - Event envelope standard
- [OpenTelemetry Primer](https://opentelemetry.io/docs/concepts/observability-primer/) - MELT concepts
- [PocketBase](https://github.com/pocketbase/pocketbase) - Single-binary pattern example
- [SQLite FAQ](https://sqlite.org/faq.html) - Performance characteristics
- [Litestream](https://litestream.io/) - SQLite backup/streaming (not replication)
- [OBD-II Codes](https://www.kbb.com/obd-ii/) - Automotive diagnostic standard
- [AUTOSAR DLT](https://www.autosar.org) - Automotive logging standard

---

## Conclusion

**Build it.** The architecture is sound, the market gap is real, and the tech choices are validated.

Focus on:
1. **Rust + SQLite edge agent** that's so light people run it everywhere
2. **Unified envelope** that works for web + IoT + ops
3. **Tiered analytics** that keeps edge simple and hub powerful
4. **Clear "Operational vs Analytical" truth** messaging

The ubiquity of lightweight edge nodes builds the funnel for the hub service.

---

*This synthesis consolidates feedback from DeepSeek, Grok, GPT-4, and Gemini reviews of RFC-001.*
