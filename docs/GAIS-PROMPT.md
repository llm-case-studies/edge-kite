# GAIS Prompt: EdgeKite Landing Page + Dashboard

Copy this prompt into Google AI Studio to generate the LP and dashboard.

---

## Prompt

Build a complete website for **EdgeKite**, a lightweight, offline-first analytics platform. The site has two pages:

1. **Landing Page** (`/`) - Marketing page with embedded live demo dashboard
2. **Full Dashboard** (`/dashboard`) - Product dashboard mockup

Use modern, clean design. Dark mode preferred. Tailwind CSS or similar utility-first styling.

---

### Page 1: Landing Page (index.html)

#### Hero Section
- Large headline: "Lightweight, Offline-First Analytics"
- Subheadline: "Track what matters. Own your data. Run anywhere."
- Two CTAs:
  - Primary: "See it in action" (smooth scroll to demo section)
  - Secondary: "View on GitHub" (link to #)

#### Features Section (4 cards in a grid)

1. **Edge-First**
   - Icon: server/chip
   - "Runs on Raspberry Pi, NVR, or any VPS. Under 50MB RAM."

2. **Offline-Capable**
   - Icon: wifi-off
   - "Store events locally, sync when connected. Never lose data."

3. **Privacy-Respecting**
   - Icon: shield/lock
   - "No cookies. No fingerprinting. No third-party scripts."

4. **Unified Events**
   - Icon: layers
   - "Web clicks, IoT sensors, server metrics—one schema fits all."

#### Live Demo Section
- Heading: "See EdgeKite tracking this page—right now"
- Subtext: "Every click, scroll, and page view on this site is captured by EdgeKite. Watch your own events appear below."

**Demo Dashboard Widget** (embedded component):
```
┌─────────────────────────────────────────────────────────┐
│ Live Events                          Visitors: 42 now  │
├─────────────────────────────────────────────────────────┤
│ ● 10:32:15  page_view    /                    you →    │
│ ○ 10:32:14  click        #features-btn                 │
│ ○ 10:32:10  scroll       50%                           │
│ ● 10:32:05  page_view    /                    you →    │
│ ○ 10:32:01  click        #cta-github                   │
└─────────────────────────────────────────────────────────┘
│ Your session: abc123  │  Events from you: 3            │
└─────────────────────────────────────────────────────────┘
```

- Events scroll in real-time (simulate with setInterval)
- Highlight "your" events with a marker or different color
- Show visitor's session ID and their event count
- Update visitor count periodically

#### How It Works Section
Simple 3-step flow with icons:

1. **Collect** - "Lightweight tracker sends events to your edge node"
2. **Store** - "SQLite database holds events locally, even offline"
3. **Sync** - "When connected, sync to your central hub"

Include a code snippet:
```javascript
// Track a custom event
edgekite.track('button_click', {
  button_id: 'signup',
  page: '/pricing'
});
```

#### Use Cases Section (3 columns)

1. **Web Analytics**
   - "Track page views, clicks, and conversions. Privacy-first alternative to Google Analytics."

2. **IoT Monitoring**
   - "Collect sensor data, camera events, and alerts from edge devices."

3. **Ops Metrics**
   - "Server health, container stats, deployment events—all in one place."

#### CTA Section
- Heading: "Ready to own your analytics?"
- Email signup form: "Get early access" with email input + submit
- Links:
  - "Self-host now →" (GitHub)
  - "Read the docs →" (#)
  - "See full dashboard →" (/dashboard)

#### Footer
- Links: GitHub, Documentation, Privacy Policy
- "Built with EdgeKite" badge
- Copyright

---

### Page 2: Full Dashboard (dashboard.html)

A complete analytics dashboard that represents what customers see in their deployments.

#### Layout Structure
```
┌──────────────────────────────────────────────────────────────┐
│ EdgeKite Dashboard                    [⚙ Settings] [? Help] │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  SOURCES   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│            │  │1,234 │ │  3   │ │  42  │ │ 2.1s │           │
│ ● All (3)  │  │events│ │source│ │pend- │ │ ago  │           │
│ ○ website  │  │today │ │active│ │ sync │ │ sync │           │
│ ○ camera-1 │  └──────┘ └──────┘ └──────┘ └──────┘           │
│ ○ sensor-2 │                                                 │
│            │  EVENT STREAM                     [All ▼] [⟳]  │
│ ────────── │  ┌────────────────────────────────────────┐    │
│            │  │ 10:32:15  web    page_view   /about    │    │
│ CATEGORIES │  │ 10:32:14  web    click       #signup   │    │
│            │  │ 10:32:10  iot    motion      zone-1    │    │
│ ☑ web      │  │ 10:32:05  iot    temp        72.5°F    │    │
│ ☑ iot      │  │ 10:32:01  ops    cpu_spike   server-1  │    │
│ ☐ ops      │  │ 10:31:55  web    scroll      75%       │    │
│ ☐ security │  └────────────────────────────────────────┘    │
│            │                                                 │
│            │  CHARTS                                         │
│            │  ┌─────────────────┐ ┌─────────────────┐       │
│            │  │ Events / Hour   │ │ By Category     │       │
│            │  │                 │ │    ┌───┐        │       │
│            │  │    /\    /\     │ │ web│███│ 58%    │       │
│            │  │   /  \  /  \    │ │ iot│██ │ 32%    │       │
│            │  │  /    \/    \   │ │ ops│█  │ 10%    │       │
│            │  └─────────────────┘ └─────────────────┘       │
├────────────┴─────────────────────────────────────────────────┤
│ CPU: 0.3% │ RAM: 42MB │ DB: 1.2MB │ Sync: ● Connected       │
└──────────────────────────────────────────────────────────────┘
```

#### Dashboard Components

**Left Sidebar:**
- Sources list with online/offline indicators
- Category filters (checkboxes)
- Collapsible sections

**Stats Cards (top row):**
- Events today (with sparkline)
- Active sources
- Pending sync count
- Last sync time

**Event Stream:**
- Real-time scrolling list
- Color-coded category badges
- Timestamp, category, type, details
- Click to expand event details
- Filter dropdown and refresh button

**Charts Row:**
- Events over time (line chart, last 24h)
- Category breakdown (donut chart)
- Use Chart.js or simple CSS/SVG charts

**Status Bar (bottom):**
- CPU percentage
- RAM usage (MB)
- Database size (MB)
- Sync status with indicator dot

**Event Detail Modal:**
When clicking an event, show full JSON:
```json
{
  "event_id": "abc-123",
  "observed_at": "2024-01-15T10:32:15Z",
  "source": {
    "type": "browser",
    "id": "sess_xyz"
  },
  "event": {
    "category": "web",
    "type": "page_view",
    "data": {
      "path": "/about",
      "referrer": "https://google.com"
    }
  }
}
```

---

### Mock Data

Generate realistic mock data for both pages. Include:

**Mock Events (mix of types):**
```javascript
const mockEvents = [
  { time: "10:32:15", category: "web", type: "page_view", detail: "/" },
  { time: "10:32:14", category: "web", type: "click", detail: "#signup-btn" },
  { time: "10:32:10", category: "iot", type: "motion", detail: "camera-1, zone-2" },
  { time: "10:32:05", category: "iot", type: "temperature", detail: "sensor-2: 72.5°F" },
  { time: "10:32:01", category: "ops", type: "cpu_spike", detail: "server-1: 85%" },
  { time: "10:31:55", category: "web", type: "scroll", detail: "75%" },
  { time: "10:31:50", category: "security", type: "login_fail", detail: "admin@..." },
  // ... more events
];
```

**Mock Sources:**
```javascript
const mockSources = [
  { id: "website", type: "browser", status: "online", events_today: 847 },
  { id: "camera-1", type: "edge_device", status: "online", events_today: 312 },
  { id: "sensor-2", type: "edge_device", status: "offline", events_today: 75 },
];
```

**Mock Stats:**
```javascript
const mockStats = {
  events_today: 1234,
  active_sources: 3,
  pending_sync: 42,
  last_sync: "2 seconds ago",
  cpu_percent: 0.3,
  ram_mb: 42,
  db_size_mb: 1.2,
  sync_status: "connected"
};
```

---

### Technical Requirements

1. **Single HTML files** - Each page self-contained (inline CSS/JS ok, or separate files)
2. **No build step** - Plain HTML/CSS/JS, no React/Vue/etc required
3. **Responsive** - Works on mobile and desktop
4. **Dark mode** - Dark background, light text, accent colors for categories
5. **Animations** - Smooth transitions, events sliding in
6. **Accessible** - Proper contrast, keyboard navigation

### Color Scheme (suggestion)
- Background: #0f172a (slate-900)
- Cards: #1e293b (slate-800)
- Text: #f8fafc (slate-50)
- Accent: #3b82f6 (blue-500)
- Web events: #22c55e (green)
- IoT events: #f59e0b (amber)
- Ops events: #8b5cf6 (purple)
- Security events: #ef4444 (red)

---

### Files to Generate

1. `index.html` - Landing page with demo dashboard
2. `dashboard.html` - Full product dashboard
3. `styles.css` - Shared styles (or inline)
4. `mock-data.js` - Mock events, sources, stats
5. `demo.js` - Demo dashboard widget logic (real-time simulation)
6. `dashboard.js` - Full dashboard logic

---

### API Endpoints (for reference)

When we replace mocks with real API:

```
GET  /api/health          → { status, version, event_count }
GET  /api/stats           → { total_events, pending_sync }
GET  /api/events/recent   → [{ event_id, observed_at, source, event }]
GET  /api/sources         → [{ id, type, status, events_today }]
GET  /api/resources       → { cpu_percent, ram_mb, db_size_mb }
POST /api/events          → Accept event, return { accepted: [id] }
```

The mock JS should use the same response shapes so swapping is easy.

---

Generate all files with complete, working code. Make it look professional and polished.
