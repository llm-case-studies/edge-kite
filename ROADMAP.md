# EdgeKite Roadmap

## Current Status: Alpha

The edge agent can ingest events, store them in SQLite, and report basic stats. No dashboard UI yet.

---

## Phase 1: Edge Agent MVP (Current)

**Goal:** Functional edge agent that can collect and store events.

- [x] HTTP server with event ingestion (`/api/events`, `/api/events/batch`)
- [x] SQLite storage with WAL mode
- [x] Health endpoint (`/api/health`)
- [x] Stats endpoint (`/api/stats`)
- [x] Resource monitoring (`/api/resources`)
- [x] Sync worker (outbox pattern)
- [x] Configuration via TOML + env vars
- [x] JS browser tracker (`sdk/js/tracker.js`)
- [ ] Timeline/query endpoint (`/api/events/recent`)
- [ ] SSE endpoint for real-time updates (`/api/stream`)
- [ ] Basic integration tests

---

## Phase 2: Landing Page & Demo

**Goal:** Public-facing site that demonstrates EdgeKite tracking itself.

- [ ] Landing page design (via GAIS)
- [ ] Demo dashboard widget (embedded in LP)
- [ ] Full dashboard mockup (`/dashboard`)
- [ ] Deploy to VPS (edge-kite.com)
- [ ] Wire LP tracker to real EdgeKite instance
- [ ] Resource comparison widget (EdgeKite vs Umami)

---

## Phase 3: Edge Dashboard UI

**Goal:** Usable dashboard shipped with the edge agent.

- [ ] SPA served by edge agent
- [ ] Event timeline with filters
- [ ] Stats overview (today's events, by category, by source)
- [ ] Top-N lists (pages, event types, sources)
- [ ] Real-time event stream
- [ ] Source health status
- [ ] Responsive design (mobile-friendly)

---

## Phase 4: Hub Integration

**Goal:** Central aggregation for fleet-wide analytics.

- [ ] Hub service (Rust or Go)
- [ ] PostgreSQL/ClickHouse storage
- [ ] Event deduplication by event_id
- [ ] Fleet overview dashboard
- [ ] Per-node drill-down
- [ ] API key management for edge nodes

---

## Phase 5: Enrichment & Advanced Analytics

**Goal:** Session stitching, UA parsing, and deeper insights.

- [ ] User agent parsing
- [ ] Bot detection
- [ ] Geo lookup (GeoIP)
- [ ] Session stitching
- [ ] Bounce rate, visit duration
- [ ] Funnel analysis
- [ ] Cohort analysis

---

## Phase 6: Production Hardening

**Goal:** Ready for production deployments.

- [ ] Authentication for edge API
- [ ] RBAC for hub dashboard
- [ ] Audit logging
- [ ] Rate limiting
- [ ] Retention policies and cleanup workers
- [ ] Docker images (multi-arch)
- [ ] Helm chart / docker-compose examples
- [ ] Documentation site

---

## Future Ideas

- Edge-to-edge sync (mesh mode)
- Alert rules engine on edge
- Mobile SDKs (iOS, Android)
- Python SDK for server-side tracking
- ClickHouse materialized views
- Grafana data source plugin
- On-My-Watch integration (NVR + ML events)

---

## Non-Goals (For Now)

- Cookie-based tracking
- Third-party integrations (GA, Segment)
- A/B testing
- Heatmaps / session replay
- Multi-tenant SaaS mode

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get involved.

Priorities are set based on the On-My-Watch use case (farm/ranch security with offline-first requirements) but the architecture supports general web/IoT analytics.
