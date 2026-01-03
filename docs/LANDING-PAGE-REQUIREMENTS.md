# EdgeKite Landing Page Requirements

## Overview

The edge-kite.com site serves two purposes:
1. **Marketing LP** with embedded demo dashboard (visitors see their own events)
2. **Full Dashboard mockup** showing what a real deployment looks like

GAIS will build both with mocked APIs. We replace mocks with real EdgeKite endpoints.

## Site Structure

```
edge-kite.com/                    ← Landing page + demo-dash widget
edge-kite.com/dashboard           ← Full dashboard (product UI mockup)
```

---

## Part 1: Landing Page

### Hero Section
- Headline: "Lightweight, Offline-First Analytics"
- Subheadline: "Track what matters. Own your data. Run anywhere."
- CTA: "See it in action" → scrolls to demo-dash

### Features Section (3-4 cards)
1. **Edge-First**: Runs on Raspberry Pi, NVR, or VPS
2. **Offline-Capable**: Store-and-forward when disconnected
3. **Privacy-Respecting**: No cookies, no PII, no third-party scripts
4. **Unified Events**: Web, IoT, and ops in one schema

### Demo Dashboard Section (embedded)
- Live widget showing events from LP visitors
- "You are visitor #X" callout
- Highlights visitor's own events in the stream
- Real-time updates (SSE or polling)

### How It Works Section
- Simple diagram: Edge nodes → Hub → Dashboard
- Code snippet showing event ingestion API

### Use Cases Section
- Web Analytics (like this page!)
- IoT/Security Monitoring (farms, cameras, sensors)
- Operational Metrics (servers, containers, edge devices)

### CTA Section
- "Get Early Access" email signup
- "Self-Host Now" → GitHub link
- "See Full Dashboard" → /dashboard

### Footer
- Links: GitHub, Docs, Privacy Policy
- "Built with EdgeKite" badge

---

## Part 2: Full Dashboard (/dashboard)

This is a **mockup of the real product dashboard** that ships with EdgeKite.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ EdgeKite Dashboard                        [Settings] [Help] │
├─────────────┬───────────────────────────────────────────────┤
│ Sources     │  Overview                                     │
│             │  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ ○ All       │  │ Events  │ │ Sources │ │ Pending │          │
│ ○ website   │  │  1,234  │ │    3    │ │   Sync  │          │
│ ○ camera-1  │  │ today   │ │ active  │ │    42   │          │
│ ○ sensor-2  │  └─────────┘ └─────────┘ └─────────┘          │
│             │                                               │
│ Categories  │  Event Stream                                 │
│             │  ┌───────────────────────────────────────┐    │
│ □ web       │  │ 10:32:15  page_view   /about          │    │
│ □ iot       │  │ 10:32:14  click       #signup-btn     │    │
│ □ ops       │  │ 10:32:10  motion      camera-1        │    │
│ □ security  │  │ 10:32:05  temp_read   sensor-2: 72°F  │    │
│             │  └───────────────────────────────────────┘    │
│             │                                               │
│             │  Charts                                       │
│             │  ┌─────────────────┐ ┌─────────────────┐      │
│             │  │ Events/hour     │ │ By Category     │      │
│             │  │ [line chart]    │ │ [pie chart]     │      │
│             │  └─────────────────┘ └─────────────────┘      │
├─────────────┴───────────────────────────────────────────────┤
│ Resource Usage: CPU 0.3% | RAM 42MB | DB 1.2MB | Sync: OK   │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Components

1. **Source Selector** (left sidebar)
   - List of event sources (websites, devices, sensors)
   - Filter by source
   - Shows source status (online/offline)

2. **Stats Cards** (top)
   - Total events (today / all time)
   - Active sources
   - Pending sync count
   - Last sync timestamp

3. **Event Stream** (main area)
   - Real-time scrolling list
   - Color-coded by category
   - Expandable event details
   - Filter by type, severity

4. **Charts** (main area)
   - Events over time (line chart)
   - Category breakdown (pie/donut)
   - Top event types (bar chart)

5. **Resource Monitor** (footer bar)
   - CPU usage
   - RAM usage
   - Database size
   - Sync status

---

## Events to Capture (LP Tracker)

### Page Events

| Event Type | Category | Trigger | Payload |
|------------|----------|---------|---------|
| `page_view` | web | Page load | `{ path, referrer, title }` |
| `page_leave` | web | Unload | `{ time_on_page_ms, scroll_depth_pct }` |

### Interaction Events

| Event Type | Category | Trigger | Payload |
|------------|----------|---------|---------|
| `click` | web | Click | `{ element_tag, element_id, text_preview }` |
| `scroll` | web | 25/50/75/100% | `{ depth_pct }` |

### Performance Events

| Event Type | Category | Trigger | Payload |
|------------|----------|---------|---------|
| `performance` | web | Load complete | `{ ttfb_ms, fcp_ms, lcp_ms }` |
| `error` | web | JS error | `{ message, filename, lineno }` |

---

## Visitor Context (Source Metadata)

Sent with every event:

```json
{
  "source": {
    "type": "browser",
    "id": "<session_id>",
    "version": "0.1.0",
    "metadata": {
      "viewport": { "width": 1920, "height": 1080 },
      "device_type": "desktop",
      "language": "en-US",
      "timezone": "America/New_York",
      "browser": "Chrome",
      "platform": "Windows",
      "referrer_domain": "google.com"
    }
  }
}
```

### Privacy Rules
- Session ID in sessionStorage only (no cookies)
- No fingerprinting
- No PII or form values
- No full user agent string

---

## API Endpoints

### Event Ingestion
```
POST /api/events        # Single event
POST /api/events/batch  # Batch events
```

### Dashboard APIs
```
GET /api/health         # Health check
GET /api/stats          # Summary stats
GET /api/stream         # SSE real-time events
GET /api/events/recent  # Last N events
GET /api/sources        # List of sources
GET /api/resources      # CPU/RAM/DB stats
```

### Mock API (GAIS)
GAIS will create mock responses matching this schema. We swap URLs to real EdgeKite.

---

## Deployment

```
edge-kite.com/
├── index.html          # LP
├── dashboard/          # Full dashboard
├── assets/             # CSS, JS, images
└── api/* → proxy to EdgeKite :8080
```

Reverse proxy (nginx or Caddy):
- Static files from /var/www/edge-kite
- /api/* → localhost:8080

---

## Success Metrics

1. Demo-dash updates feel instant
2. Visitors watch their own events (time on page)
3. Click-through to /dashboard
4. GitHub stars / signup conversions
