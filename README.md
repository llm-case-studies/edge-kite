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

**Phase:** Early Development

- [x] Architecture design (RFC-001)
- [x] Multi-AI review and synthesis
- [ ] Edge agent MVP (Tier 0: ingest + timeline)
- [ ] Edge dashboard (Tier 1: counts, top-N, health)
- [ ] Hub integration
- [ ] SDKs (JS tracker, Python agent)

## Documentation

- [Architecture](./ARCHITECTURE.md) - Detailed system design
- [Event Schema](./docs/event-schema.md) - Unified event envelope
- [RFC-001](./docs/research/RFC-001-UNIFIED-EVENT-ARCHITECTURE.md) - Original design document
- [AI Synthesis](./docs/research/SYNTHESIS-AI-FEEDBACK.md) - Consolidated review feedback

## Quick Start

*Coming soon*

```bash
# Edge agent (Rust)
cargo install edge-kite
edge-kite --config /path/to/config.toml

# Or via Docker
docker run -v ./data:/data ghcr.io/edge-kite/edge-kite:latest
```

## License

MIT License - see [LICENSE](./LICENSE)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**EdgeKite** - Lightweight analytics that fly.
