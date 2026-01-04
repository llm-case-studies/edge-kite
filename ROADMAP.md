# EdgeKite Roadmap

## Vision

EdgeKite is more than analytics—it's **tiered intelligence** for edge deployments:

```
┌─────────────────────────────────────────────────────────────┐
│ EDGE (Instant, Local, Private)                              │
│ Rule-based pattern detection, local alerts                  │
└─────────────────────────────────────────────────────────────┘
                            │ sync
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ HUB (Fleet-wide, Smarter)                                   │
│ Cross-node correlation, local ML, pattern library           │
└─────────────────────────────────────────────────────────────┘
                            │ escalate (PII scrubbed)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ CLOUD GURU (Privacy Airlock → Gemini/GPT/Claude)            │
│ Natural language analysis, incident summaries               │
└─────────────────────────────────────────────────────────────┘
```

The "universal piping" insight—**events are events**—enables web analytics, IoT monitoring, and intranet observability through the same system.

---

## Current Status: Alpha

Edge agent MVP complete. GAIS prototype available. No production dashboard yet.

---

## Phase 1: Edge Agent MVP ✅

**Goal:** Functional edge agent that can collect and store events.

- [x] HTTP server with event ingestion (`/api/events`, `/api/events/batch`)
- [x] SQLite storage with WAL mode
- [x] Health endpoint (`/api/health`)
- [x] Stats endpoint (`/api/stats`)
- [x] Resource monitoring (`/api/resources`)
- [x] Sync worker (outbox pattern)
- [x] Configuration via TOML + env vars
- [x] JS browser tracker (`sdk/js/tracker.js`)
- [x] Unit tests for database layer
- [ ] Timeline/query endpoint (`/api/events/recent`)
- [ ] SSE endpoint for real-time updates (`/api/stream`)

---

## Phase 2: Dashboard & Contextual Gateway 🚧

**Goal:** Themed dashboard that speaks the user's language.

### Core Dashboard
- [x] GAIS prototype (React/TypeScript)
- [ ] Integrate with real EdgeKite API
- [ ] Event timeline with filters
- [ ] Stats overview (today's events, by category, by source)
- [ ] Real-time event stream (SSE)
- [ ] Source health status

### Contextual Gateway (Polymorphic UI)
- [x] Theme system (CSS variables + vocabulary mapping)
- [x] **Edge Theme** - DevOps/Web (Sources, Traffic, Visitors)
- [x] **Ranch Theme** - Agritech (Assets, Livestock, Water, Weather)
- [x] **Legal Theme** - Compliance (Custodians, Evidence, Chain of Custody)
- [x] **Fun-EE Theme** - Corporate Intranet (Legacy Apps, PHP Timeouts, Print Jobs)
- [ ] Theme selector in settings
- [ ] Per-source theme override

### Multilingual
- [x] i18n structure (EN, ES, PT, DE)
- [ ] Complete translations
- [ ] RTL support (future: AR, HE)

---

## Phase 3: Pattern Detection Engine

**Goal:** Detect meaningful event sequences, not just individual events.

### The Problem
Individual events look innocent:
```
02:15  login_failed   → Typo?
02:17  power_down     → Outage?
02:19  power_up       → Restored
02:20  all_clear      → Normal
```

But the **sequence** means: "Break-in attempt, pulled plug to avoid recording, cleared status."

### Edge-Side Patterns (v1.5)
- [ ] JSON-based rule engine
- [ ] Pattern definition format:
  ```json
  {
    "name": "Suspicious Power Cycle",
    "logic": "login_failed THEN power_down WITHIN 5m",
    "severity": "critical"
  }
  ```
- [ ] Local pattern matching (no network required)
- [ ] Built-in pattern library (security, IoT, web)
- [ ] Local alerting (webhook, LED, buzzer)
- [ ] Rust/WASM rule engine for performance

### Hub-Side Patterns (v2.0)
- [ ] Cross-node correlation (Barn + Gate + House)
- [ ] Pattern library sync from community
- [ ] Pattern suggestions based on fleet data

---

## Phase 4: Hub Integration

**Goal:** Central aggregation for fleet-wide analytics.

- [ ] Hub service (Rust or Go)
- [ ] PostgreSQL/ClickHouse storage
- [ ] Event deduplication by event_id
- [ ] Fleet overview dashboard
- [ ] Per-node drill-down
- [ ] API key management for edge nodes
- [ ] Cross-node event correlation

---

## Phase 5: Tiered Intelligence

**Goal:** Smarter analysis at each tier.

### Hub ML (Local Model)
- [ ] Anomaly detection on event streams
- [ ] Learned patterns (auto-discovered sequences)
- [ ] Baseline deviation alerts
- [ ] Time-series forecasting (when will disk fill?)

### Privacy Airlock (Cloud Escalation)
- [ ] PII scrubbing before cloud send
- [ ] Regex-based redaction (IPs, emails, names)
- [ ] Gemini/GPT/Claude integration
- [ ] Natural language incident summaries
- [ ] "What do you see in this sequence?" queries
- [ ] Suggested patterns from AI analysis

---

## Phase 6: Enrichment & Advanced Analytics

**Goal:** Session stitching, UA parsing, and deeper insights (Hub only).

- [ ] User agent parsing
- [ ] Bot detection
- [ ] Geo lookup (GeoIP)
- [ ] Session stitching
- [ ] Bounce rate, visit duration
- [ ] Funnel analysis
- [ ] Cohort analysis

---

## Phase 7: Production Hardening

**Goal:** Ready for production deployments.

- [ ] Authentication for edge API
- [ ] RBAC for hub dashboard
- [ ] Audit logging
- [ ] Rate limiting
- [ ] Retention policies and cleanup workers
- [ ] Docker images (multi-arch: amd64, arm64, armv7)
- [ ] Helm chart / docker-compose examples
- [ ] Documentation site

---

## Use Cases Enabled

| Use Case | Theme | Key Events |
|----------|-------|------------|
| **Farm/Ranch Security** | Ranch | motion, gate_ajar, water_level, power_cycle |
| **Web Analytics** | Edge | page_view, click, scroll, conversion |
| **Intranet Monitoring** | Fun-EE | legacy_php_timeout, failed_login, print_job |
| **Legal/Compliance** | Legal | evidence_access, chain_of_custody, audit_trail |
| **Van Life / Maritime** | Edge | solar_level, water_tank, gps_fix, sync_burst |
| **Home Lab** | Edge | keg_temp, sourdough_proof, obd2_log |

---

## Content & Marketing

- [x] NotebookLM outputs (video, audio, infographic, investment memo)
- [x] GAIS social media scripts (TikTok/Reels, LinkedIn, Twitter)
- [x] Idea Pack (Kegerator, Sourdough, Retro Car)
- [ ] Landing page deployment (edge-kite.com)
- [ ] YouTube Shorts / TikTok presence (@FunPilsner handle)
- [ ] Dev.to / Hashnode technical posts

---

## Architecture Artifacts

| Document | Purpose |
|----------|---------|
| `docs/ARCHITECTURE.md` | System design, tiered model |
| `docs/BACKEND_HANDOFF.md` | API contracts for frontend integration |
| `docs/GATEWAY_STRATEGY.md` | Contextual UI approach |
| `docs/RUST_SPEC.md` | Pattern engine specification |
| `docs/WHITEPAPER_MISSING_MIDDLE.md` | Market positioning |

---

## Non-Goals (For Now)

- Cookie-based tracking
- Third-party integrations (GA, Segment export)
- A/B testing
- Heatmaps / session replay
- Multi-tenant SaaS mode (Hub is single-tenant or self-hosted)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get involved.

The project serves multiple use cases but priorities are set based on the **On-My-Watch** scenario: farm/ranch security with NVR + ML, offline-first requirements, and tiered intelligence from edge to cloud.
