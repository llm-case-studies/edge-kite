//! Event types and schema for EdgeKite

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Source of an event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Source {
    /// Type of source (browser, edge_device, server, mobile)
    #[serde(rename = "type")]
    pub source_type: String,

    /// Unique identifier for this source
    pub id: String,

    /// Software/firmware version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,

    /// Additional source metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Event details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventDetails {
    /// Category (web, iot, app, ops, security)
    pub category: String,

    /// Specific event type
    #[serde(rename = "type")]
    pub event_type: String,

    /// Severity level
    #[serde(default = "default_severity")]
    pub severity: String,

    /// Schema version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema_version: Option<String>,

    /// Event-specific payload
    pub data: serde_json::Value,
}

fn default_severity() -> String {
    "info".to_string()
}

/// Correlation information for linking events
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Correlation {
    /// Correlation ID for related events
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,

    /// Session ID (for web/app events)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,

    /// Incident ID (for IoT events)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub incident_id: Option<String>,
}

/// Attachment reference (media stored out-of-band)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    /// Kind of attachment (thumbnail, clip, log, report)
    pub kind: String,

    /// URI to the attachment
    pub uri: String,

    /// SHA256 hash of the content
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sha256: Option<String>,

    /// Size in bytes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size_bytes: Option<u64>,

    /// MIME type
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
}

/// Privacy and retention settings
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Privacy {
    /// Contains PII
    #[serde(default)]
    pub pii: bool,

    /// Retention class (short, standard, long)
    #[serde(default = "default_retention_class")]
    pub retention_class: String,
}

fn default_retention_class() -> String {
    "standard".to_string()
}

/// Sync status (internal)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SyncStatus {
    /// Has been synced to hub
    #[serde(default)]
    pub synced: bool,

    /// Monotonic sequence per source
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_seq: Option<i64>,
}

/// Complete event envelope
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    /// Unique event identifier
    pub event_id: String,

    /// When the event occurred (source clock)
    pub observed_at: DateTime<Utc>,

    /// When the collector received it
    pub received_at: DateTime<Utc>,

    /// Source information
    pub source: Source,

    /// Event details
    pub event: EventDetails,

    /// Correlation information
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation: Option<Correlation>,

    /// Attachment references
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attachments: Option<Vec<Attachment>>,

    /// Privacy settings
    #[serde(skip_serializing_if = "Option::is_none")]
    pub privacy: Option<Privacy>,

    /// Sync status
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync: Option<SyncStatus>,
}

/// Incoming event (before processing)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomingEvent {
    /// Event ID (optional, will be generated if missing)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event_id: Option<String>,

    /// When the event occurred (optional, defaults to now)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub observed_at: Option<DateTime<Utc>>,

    /// Source information
    pub source: Source,

    /// Event details
    pub event: EventDetails,

    /// Correlation information
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation: Option<Correlation>,

    /// Attachment references
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attachments: Option<Vec<Attachment>>,

    /// Privacy settings
    #[serde(skip_serializing_if = "Option::is_none")]
    pub privacy: Option<Privacy>,
}

impl IncomingEvent {
    /// Convert to a full Event with generated fields
    pub fn into_event(self) -> Event {
        let now = Utc::now();

        Event {
            event_id: self.event_id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            observed_at: self.observed_at.unwrap_or(now),
            received_at: now,
            source: self.source,
            event: self.event,
            correlation: self.correlation,
            attachments: self.attachments,
            privacy: self.privacy,
            sync: Some(SyncStatus::default()),
        }
    }
}

/// Validate event category
pub fn validate_category(category: &str) -> bool {
    matches!(category, "web" | "iot" | "app" | "ops" | "security")
}

/// Validate source type
pub fn validate_source_type(source_type: &str) -> bool {
    matches!(source_type, "browser" | "edge_device" | "server" | "mobile")
}

/// Validate severity
pub fn validate_severity(severity: &str) -> bool {
    matches!(severity, "debug" | "info" | "warn" | "error" | "critical")
}
