# EdgeKite Event Schema

This document defines the unified event schema used across all EdgeKite components.

## Design Principles

1. **Unified Envelope**: All events share common metadata fields
2. **Flexible Payload**: Event-specific data in `data` field
3. **Offline-Aware**: Timestamps and sequences for clock-drift handling
4. **Privacy-Ready**: Built-in PII and retention tagging
5. **Sync-Friendly**: Outbox pattern support in schema

## Event Envelope

```json
{
  "event_id": "string (UUID)",
  "observed_at": "string (ISO 8601)",
  "received_at": "string (ISO 8601)",
  "source": { ... },
  "event": { ... },
  "correlation": { ... },
  "attachments": [ ... ],
  "privacy": { ... },
  "sync": { ... }
}
```

## Field Reference

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_id` | UUID string | Yes | Unique identifier, used for deduplication |
| `observed_at` | ISO 8601 | Yes | When the event occurred (source clock) |
| `received_at` | ISO 8601 | Yes | When the collector received it (collector clock) |
| `source` | object | Yes | Source identification |
| `event` | object | Yes | Event type and payload |
| `correlation` | object | No | Linking related events |
| `attachments` | array | No | References to media/files |
| `privacy` | object | No | PII and retention tags |
| `sync` | object | No | Sync status (internal) |

### Source Object

```json
{
  "source": {
    "type": "browser|edge_device|server|mobile",
    "id": "unique-source-identifier",
    "version": "1.0.0",
    "metadata": {
      "key": "value"
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Source type category |
| `id` | string | Yes | Unique identifier for this source |
| `version` | string | No | Software/firmware version |
| `metadata` | object | No | Additional source context |

#### Source Types

- `browser` - Web browser (ephemeral)
- `edge_device` - IoT device, camera, sensor (persistent)
- `server` - Backend service
- `mobile` - Mobile app

### Event Object

```json
{
  "event": {
    "category": "web|iot|app|ops|security",
    "type": "page_view|person_detected|error|heartbeat",
    "severity": "debug|info|warn|error|critical",
    "schema_version": "1.0",
    "data": {
      // Event-specific payload
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | string | Yes | Event category |
| `type` | string | Yes | Specific event type |
| `severity` | string | No | Log level (default: info) |
| `schema_version` | string | No | Payload schema version |
| `data` | object | Yes | Event-specific payload |

#### Categories

- `web` - Web analytics (page views, clicks, etc.)
- `iot` - IoT/edge events (detections, readings)
- `app` - Application events (user actions, errors)
- `ops` - Operational events (heartbeats, health)
- `security` - Security events (logins, access, audits)

### Correlation Object

```json
{
  "correlation": {
    "correlation_id": "uuid",
    "session_id": "optional-session-id",
    "incident_id": "optional-incident-id"
  }
}
```

Used to link related events together.

### Attachments Array

```json
{
  "attachments": [
    {
      "kind": "thumbnail|clip|log|report",
      "uri": "file:///path/to/file.jpg",
      "sha256": "abc123...",
      "size_bytes": 45000,
      "mime_type": "image/jpeg"
    }
  ]
}
```

**Important**: Attachments are references only. Binary data is stored out-of-band.

### Privacy Object

```json
{
  "privacy": {
    "pii": false,
    "retention_class": "short|standard|long"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pii` | boolean | Contains personally identifiable information |
| `retention_class` | string | Retention policy tier |

Retention classes:
- `short` - 7 days
- `standard` - 30 days (default)
- `long` - 1 year

### Sync Object (Internal)

```json
{
  "sync": {
    "synced": false,
    "source_seq": 12345
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `synced` | boolean | Has been synced to hub |
| `source_seq` | integer | Monotonic sequence per source |

## Event Type Examples

### Web: Page View

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "observed_at": "2026-01-02T10:30:00.000Z",
  "received_at": "2026-01-02T10:30:00.050Z",
  "source": {
    "type": "browser",
    "id": "sess_abc123",
    "metadata": {
      "site_id": "my-blog"
    }
  },
  "event": {
    "category": "web",
    "type": "page_view",
    "data": {
      "url": "/blog/my-first-post",
      "referrer": "https://google.com/search?q=...",
      "title": "My First Post",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "screen_width": 1920,
      "screen_height": 1080,
      "language": "en-US"
    }
  }
}
```

### Web: Click

```json
{
  "event_id": "...",
  "observed_at": "...",
  "received_at": "...",
  "source": {
    "type": "browser",
    "id": "sess_abc123"
  },
  "event": {
    "category": "web",
    "type": "click",
    "data": {
      "element": "button#subscribe",
      "text": "Subscribe Now",
      "url": "/pricing",
      "x": 450,
      "y": 320
    }
  },
  "correlation": {
    "session_id": "sess_abc123"
  }
}
```

### IoT: Person Detected

```json
{
  "event_id": "...",
  "observed_at": "2026-01-02T14:23:15.000Z",
  "received_at": "2026-01-02T14:23:15.100Z",
  "source": {
    "type": "edge_device",
    "id": "camera-barn-01",
    "version": "nvr-2.1.0",
    "metadata": {
      "site_id": "farm-17",
      "location": "barn-entrance"
    }
  },
  "event": {
    "category": "iot",
    "type": "person_detected",
    "severity": "warn",
    "data": {
      "confidence": 0.94,
      "bbox": {"x": 100, "y": 200, "w": 50, "h": 120},
      "model": "yolov8n",
      "inference_ms": 45
    }
  },
  "attachments": [
    {
      "kind": "thumbnail",
      "uri": "file:///media/events/2026/01/02/det_001.jpg",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "size_bytes": 45000,
      "mime_type": "image/jpeg"
    }
  ],
  "correlation": {
    "incident_id": "inc_456"
  }
}
```

### IoT: Sensor Reading

```json
{
  "event_id": "...",
  "observed_at": "...",
  "received_at": "...",
  "source": {
    "type": "edge_device",
    "id": "sensor-temp-01"
  },
  "event": {
    "category": "iot",
    "type": "reading",
    "data": {
      "metric": "temperature",
      "value": 23.5,
      "unit": "celsius"
    }
  }
}
```

### Ops: Heartbeat

```json
{
  "event_id": "...",
  "observed_at": "...",
  "received_at": "...",
  "source": {
    "type": "edge_device",
    "id": "edge-node-farm-17"
  },
  "event": {
    "category": "ops",
    "type": "heartbeat",
    "data": {
      "uptime_seconds": 86400,
      "cpu_percent": 12.5,
      "memory_percent": 45.2,
      "disk_percent": 23.1,
      "event_count": 1542,
      "events_pending_sync": 42,
      "last_sync_at": "2026-01-02T10:00:00Z"
    }
  }
}
```

### Security: Login Attempt

```json
{
  "event_id": "...",
  "observed_at": "...",
  "received_at": "...",
  "source": {
    "type": "edge_device",
    "id": "edge-node-farm-17"
  },
  "event": {
    "category": "security",
    "type": "login_attempt",
    "severity": "warn",
    "data": {
      "username": "admin",
      "success": false,
      "ip": "192.168.1.50",
      "reason": "invalid_password",
      "attempts": 3
    }
  },
  "privacy": {
    "pii": true,
    "retention_class": "long"
  }
}
```

### App: Error

```json
{
  "event_id": "...",
  "observed_at": "...",
  "received_at": "...",
  "source": {
    "type": "browser",
    "id": "sess_abc123"
  },
  "event": {
    "category": "app",
    "type": "error",
    "severity": "error",
    "data": {
      "message": "Cannot read property 'map' of undefined",
      "stack": "TypeError: Cannot read property 'map'...",
      "url": "/dashboard",
      "line": 42,
      "column": 15
    }
  }
}
```

## Ingestion Endpoints

### Single Event

```http
POST /events
Content-Type: application/json

{
  "source": { ... },
  "event": { ... }
}
```

The collector will add `event_id`, `received_at`, and `sync` fields.

### Batch Events

```http
POST /events/batch
Content-Type: application/json

[
  { "source": { ... }, "event": { ... } },
  { "source": { ... }, "event": { ... } }
]
```

## Validation Rules

1. `event_id` must be unique (used for deduplication)
2. `observed_at` must be valid ISO 8601
3. `source.type` must be one of: browser, edge_device, server, mobile
4. `event.category` must be one of: web, iot, app, ops, security
5. `event.type` is freeform but should be lowercase_snake_case
6. `attachments[].uri` must be a valid URI (file://, https://, s3://)

## Versioning

The schema version is tracked in `event.schema_version`. Changes follow semantic versioning:

- **Major**: Breaking changes to required fields
- **Minor**: New optional fields
- **Patch**: Documentation/clarification only

Current version: `1.0`
