# EdgeKite

**Lightweight, offline-first analytics for edge deployments.**

EdgeKite is a unified event collection platform that runs on resource-constrained edge devices (Raspberry Pi, NVRs, embedded systems) and syncs to a central hub when connectivity is available.

```
         ____
        /    \
       /  ()  \    <- Kite (edge node)
      /________\      Lightweight, flies independently
          ||
          ||         <- String (sync when connected)
          ||
      =========      <- Ground (hub)
       [  HQ  ]         Central analytics
```

## Why EdgeKite?

The analytics landscape is bifurcated:
- **Too Heavy:** Enterprise IoT stacks (AWS Greengrass, Azure IoT Edge) require 500MB+ RAM
- **Too Simple:** Raw logs and CSV files don't sync or visualize

EdgeKite is the **missing middle**: Umami-like dashboard experience with offline-first resilience.

## Use Cases

- **Farm/Ranch Security:** NVR + ML detecting people/vehicles, farmer views events on phone via local WiFi
- **Air-Gapped Offices:** Privacy-first analytics that never leave the premises
- **Maritime/Logistics:** Sync when docked or in satellite range
- **Retail/Branch Monitoring:** Raspberry Pi probes tracking footfall, syncing to HQ nightly
- **Self-Hosters:** Local-first observability with optional federation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  EDGE NODE (farm, office, ship)                             │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────────┐ │
│  │ Events  │───▶│ EdgeKite    │───▶│ SQLite + Local UI    │ │
│  │ (any)   │    │ Agent       │    │ "Operational Truth"  │ │
│  └─────────┘    └─────────────┘    └──────────┬───────────┘ │
└─────────────────────────────────────┼─────────┘─────────────┘
                                      │ (sync when connected)
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│  HUB (cloud/home)                                           │
│  - Aggregated view across all nodes                         │
│  - Enrichment (UA parsing, geo, bot filtering)              │
│  - "Analytical Truth" (sessions, uniques, funnels)          │
│  - Long retention, RBAC, audit                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

1. **Offline-First:** Full utility on LAN without hub connectivity
2. **Lightweight:** <100MB RAM target for edge agent
3. **Unified Events:** One schema for web analytics, IoT detections, and ops metrics
4. **Tiered Analytics:** Edge = fast operational view, Hub = deep analytical truth
5. **Durable:** SQLite with WAL mode, survives power loss

## Tech Stack

| Component | Technology |
|-----------|------------|
| Edge Agent | Rust + SQLite |
| Edge UI | SPA (served by agent) |
| Sync | Outbox pattern over HTTP |
| Hub | PostgreSQL/ClickHouse |
| Hub UI | TBD |

## Project Status

**Phase:** Alpha Development

- [x] Architecture design (RFC-001)
- [x] Multi-AI review and synthesis
- [x] Edge agent MVP (Tier 0: ingest, stats, health, resources)
- [x] JS browser tracker (sdk/js/tracker.js)
- [ ] Edge dashboard UI (Tier 1: counts, top-N, timeline)
- [ ] Hub integration
- [ ] Landing page (edge-kite.com)
- [ ] Python SDK

## Documentation

- [Architecture](./ARCHITECTURE.md) - Detailed system design
- [Event Schema](./docs/event-schema.md) - Unified event envelope
- [RFC-001](./docs/research/RFC-001-UNIFIED-EVENT-ARCHITECTURE.md) - Original design document
- [AI Synthesis](./docs/research/SYNTHESIS-AI-FEEDBACK.md) - Consolidated review feedback

## Quick Start

### Build from Source

```bash
# Clone the repo
git clone https://github.com/llm-case-studies/edge-kite.git
cd edge-kite/edge

# Build (requires Rust 1.70+)
cargo build --release

# Run with default config
./target/release/edge-kite

# Or with custom config
./target/release/edge-kite --config /path/to/config.toml --data-dir ./data
```

### Configuration

Create a `config.toml` (see `examples/config.toml`):

```toml
[server]
listen = "0.0.0.0:8080"
cors_enabled = true

[sync]
enabled = false  # Set true to sync to hub
# hub_url = "https://hub.example.com"
# api_key = "ek_..."
```

### Send Events

```bash
# Single event
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "source": {"type": "browser", "id": "test-session"},
    "event": {"category": "web", "type": "page_view", "data": {"path": "/"}}
  }'

# Check health
curl http://localhost:8080/api/health

# Get stats
curl http://localhost:8080/api/stats

# Get resource usage
curl http://localhost:8080/api/resources
```

### Browser Tracker

```html
<script src="/tracker.js" data-endpoint="/api/events"></script>
```

See `sdk/js/tracker.js` for the lightweight (~5KB) browser tracker.

## License

MIT License - see [LICENSE](./LICENSE)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**EdgeKite** - Lightweight analytics that fly.
