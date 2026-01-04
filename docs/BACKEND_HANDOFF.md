
# Backend Handoff Guide

**Target Audience:** Backend Engineers (Rust/Go/Node)  
**Version:** v0.5.0  
**Context:** Replacing the React `mock-data.ts` and `localStorage` layer with a real edge-native backend.

---

## 1. Data Models

The backend needs to support two primary entity types: `EdgeEvent` (Immutable Logs) and `PatternDef` (Mutable Rules).

### A. EdgeEvent (The Log)
Stored in SQLite (Edge) and Postgres/ClickHouse (Hub).

```json
{
  "id": "uuid-v4",
  "timestamp": "ISO-8601 (UTC)",
  "received_at": "ISO-8601 (UTC) - server time",
  "category": "web | iot | ops | security",
  "type": "string (e.g., 'page_load', 'temp_reading')",
  "detail": "string (Human readable summary)",
  "source_id": "string (Device ID or Session ID)",
  "meta": {
    "ip": "192.168.1.x",
    "user_agent": "Mozilla/5.0...",
    "custom_metric": 123
  },
  "synced": false
}
```

> **Note on Localization:** The Backend stores *technical* keys for `type` (e.g., `legacy_php_timeout`). The Frontend is responsible for translating these into German/Spanish/Portuguese labels (`PHP Fataler Fehler`). Do not localize data in the DB.

### B. PatternDef (The Rule)
Used by the Rust Rule Engine to detect anomalies.

```json
{
  "id": "pt-001",
  "name": "High CPU Load",
  "severity": "critical",
  "logic": "cpu_percent > 90 FOR 5m",
  "status": "active"
}
```

---

## 2. API Contract (REST)

The React frontend expects the following endpoints to be available on `http://localhost:3000/api/v1` (or relative path).

### Ingest
*   **POST** `/ingest`
*   **Body:** `EdgeEvent` (without `id` or `received_at`, backend generates those).
*   **Behavior:**
    1.  Validate payload.
    2.  Run against **Pattern Engine** in-memory.
    3.  Persist to SQLite.
    4.  Broadcast via WebSocket (optional, for real-time dashboard).

### Read
*   **GET** `/events`
*   **Params:**
    *   `limit`: number (default 100)
    *   `offset`: number
    *   `category`: filter
    *   `source`: filter
*   **Response:** `Array<EdgeEvent>`

### System Stats
*   **GET** `/stats`
*   **Response:**
    ```json
    {
      "eventsToday": 1200,
      "activeSources": 4,
      "pendingSync": 12,
      "cpuPercent": 1.2,
      "ramMb": 45.0,
      "dbSizeMb": 12.4,
      "syncStatus": "Connected"
    }
    ```

### Sync (Edge -> Hub)
*   **POST** `/sync/trigger`
*   **Behavior:** Manually triggers the "Outbox" worker to flush pending events to the Central Hub immediately.

---

## 3. Special Logic Implementation

### The "Fun-EE" Tracker
The frontend `tracker.ts` script automatically captures:
*   `window.performance.timing` -> `ops` / `page_load`
*   `window.onerror` -> `security` / `js_error`

**Backend Requirement:** Ensure the `/ingest` endpoint accepts Cross-Origin (CORS) requests if we plan to drop this script onto other internal legacy apps (e.g., the PHP HR Portal).

### The Privacy Airlock (Gemini Integration)
Currently, the **Frontend** calls the Gemini API directly.
For production security, we should move this to a **Backend Proxy**:

1.  **Frontend** sends `POST /api/v1/analyze` with `{ raw_log: "..." }`.
2.  **Backend** applies Regex Scrubbing (Redacts IPs, Names, Email patterns).
3.  **Backend** holds the API Key (`process.env.API_KEY`) and calls Google GenAI.
4.  **Backend** returns the analysis string.

**Why?** This prevents the Gemini API Key from being exposed in the browser bundle.

---

## 4. Multilingual Support
The Frontend handles all UI localization. The Backend needs to support **UTF-8** storage for the `detail` field, as users might manually enter notes in Spanish or German.
