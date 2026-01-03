//! Database operations for EdgeKite

use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::{Arc, Mutex};

use crate::error::Result;
use crate::event::Event;

/// Database wrapper with thread-safe connection
#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    /// Open database at the given path
    pub fn open(path: &Path) -> Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(path)?;

        // Enable WAL mode for better concurrency
        conn.execute_batch(
            "
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA cache_size = -2000;  -- 2MB cache
            PRAGMA busy_timeout = 5000;
            ",
        )?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// Run database migrations
    pub fn migrate(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch(
            r#"
            -- Core events table
            CREATE TABLE IF NOT EXISTS events (
                event_id TEXT PRIMARY KEY,
                observed_at INTEGER NOT NULL,
                received_at INTEGER NOT NULL,
                source_type TEXT NOT NULL,
                source_id TEXT NOT NULL,
                source_seq INTEGER,
                category TEXT NOT NULL,
                type TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'info',
                correlation_id TEXT,
                payload_json TEXT NOT NULL,
                attachments_json TEXT,
                pii INTEGER NOT NULL DEFAULT 0,
                retention_class TEXT NOT NULL DEFAULT 'standard',
                synced INTEGER NOT NULL DEFAULT 0
            );

            -- Indexes for common queries
            CREATE INDEX IF NOT EXISTS idx_events_observed ON events(observed_at);
            CREATE INDEX IF NOT EXISTS idx_events_type_observed ON events(type, observed_at);
            CREATE INDEX IF NOT EXISTS idx_events_source_observed ON events(source_id, observed_at);
            CREATE INDEX IF NOT EXISTS idx_events_synced ON events(synced, observed_at);
            CREATE INDEX IF NOT EXISTS idx_events_category ON events(category, observed_at);

            -- Rollup table for Tier 1+ analytics
            CREATE TABLE IF NOT EXISTS hourly_counts (
                hour_bucket INTEGER NOT NULL,
                source_id TEXT NOT NULL,
                type TEXT NOT NULL,
                count INTEGER NOT NULL,
                PRIMARY KEY (hour_bucket, source_id, type)
            );

            -- Agent configuration
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            );
            "#,
        )?;

        Ok(())
    }

    /// Insert a single event
    pub fn insert_event(&self, event: &Event) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        let payload_json = serde_json::to_string(&event.event.data)?;
        let attachments_json = event
            .attachments
            .as_ref()
            .map(|a| serde_json::to_string(a))
            .transpose()?;

        let pii = event.privacy.as_ref().map(|p| p.pii).unwrap_or(false);
        let retention_class = event
            .privacy
            .as_ref()
            .map(|p| p.retention_class.as_str())
            .unwrap_or("standard");
        let synced = event.sync.as_ref().map(|s| s.synced).unwrap_or(false);
        let source_seq = event.sync.as_ref().and_then(|s| s.source_seq);
        let correlation_id = event.correlation.as_ref().and_then(|c| c.correlation_id.as_ref());

        conn.execute(
            r#"
            INSERT INTO events (
                event_id, observed_at, received_at,
                source_type, source_id, source_seq,
                category, type, severity, correlation_id,
                payload_json, attachments_json,
                pii, retention_class, synced
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
            ON CONFLICT(event_id) DO NOTHING
            "#,
            params![
                event.event_id,
                event.observed_at.timestamp_millis(),
                event.received_at.timestamp_millis(),
                event.source.source_type,
                event.source.id,
                source_seq,
                event.event.category,
                event.event.event_type,
                event.event.severity,
                correlation_id,
                payload_json,
                attachments_json,
                pii as i32,
                retention_class,
                synced as i32,
            ],
        )?;

        Ok(())
    }

    /// Insert multiple events in a transaction
    pub fn insert_events(&self, events: &[Event]) -> Result<usize> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        let mut count = 0;

        for event in events {
            let payload_json = serde_json::to_string(&event.event.data)?;
            let attachments_json = event
                .attachments
                .as_ref()
                .map(|a| serde_json::to_string(a))
                .transpose()?;

            let pii = event.privacy.as_ref().map(|p| p.pii).unwrap_or(false);
            let retention_class = event
                .privacy
                .as_ref()
                .map(|p| p.retention_class.as_str())
                .unwrap_or("standard");
            let synced = event.sync.as_ref().map(|s| s.synced).unwrap_or(false);
            let source_seq = event.sync.as_ref().and_then(|s| s.source_seq);
            let correlation_id = event.correlation.as_ref().and_then(|c| c.correlation_id.as_ref());

            let rows = tx.execute(
                r#"
                INSERT INTO events (
                    event_id, observed_at, received_at,
                    source_type, source_id, source_seq,
                    category, type, severity, correlation_id,
                    payload_json, attachments_json,
                    pii, retention_class, synced
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
                ON CONFLICT(event_id) DO NOTHING
                "#,
                params![
                    event.event_id,
                    event.observed_at.timestamp_millis(),
                    event.received_at.timestamp_millis(),
                    event.source.source_type,
                    event.source.id,
                    source_seq,
                    event.event.category,
                    event.event.event_type,
                    event.event.severity,
                    correlation_id,
                    payload_json,
                    attachments_json,
                    pii as i32,
                    retention_class,
                    synced as i32,
                ],
            )?;
            count += rows;
        }

        tx.commit()?;
        Ok(count)
    }

    /// Get unsynced events (for sync worker)
    pub fn get_unsynced_events(&self, limit: usize) -> Result<Vec<Event>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT event_id, observed_at, received_at,
                   source_type, source_id, source_seq,
                   category, type, severity, correlation_id,
                   payload_json, attachments_json,
                   pii, retention_class
            FROM events
            WHERE synced = 0
            ORDER BY observed_at ASC
            LIMIT ?
            "#,
        )?;

        let events = stmt
            .query_map([limit], |row| {
                Ok(EventRow {
                    event_id: row.get(0)?,
                    observed_at: row.get(1)?,
                    received_at: row.get(2)?,
                    source_type: row.get(3)?,
                    source_id: row.get(4)?,
                    source_seq: row.get(5)?,
                    category: row.get(6)?,
                    event_type: row.get(7)?,
                    severity: row.get(8)?,
                    correlation_id: row.get(9)?,
                    payload_json: row.get(10)?,
                    attachments_json: row.get(11)?,
                    pii: row.get(12)?,
                    retention_class: row.get(13)?,
                })
            })?
            .filter_map(|r| r.ok())
            .filter_map(|row| row.into_event().ok())
            .collect();

        Ok(events)
    }

    /// Mark events as synced
    pub fn mark_synced(&self, event_ids: &[String]) -> Result<usize> {
        if event_ids.is_empty() {
            return Ok(0);
        }

        let conn = self.conn.lock().unwrap();
        let placeholders: Vec<&str> = event_ids.iter().map(|_| "?").collect();
        let query = format!(
            "UPDATE events SET synced = 1 WHERE event_id IN ({})",
            placeholders.join(",")
        );

        let mut stmt = conn.prepare(&query)?;
        let params: Vec<&dyn rusqlite::ToSql> = event_ids.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
        let count = stmt.execute(params.as_slice())?;

        Ok(count)
    }

    /// Get event count
    pub fn event_count(&self) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM events", [], |row| row.get(0))?;
        Ok(count)
    }

    /// Get pending sync count
    pub fn pending_sync_count(&self) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM events WHERE synced = 0", [], |row| row.get(0))?;
        Ok(count)
    }
}

/// Internal row representation
struct EventRow {
    event_id: String,
    observed_at: i64,
    received_at: i64,
    source_type: String,
    source_id: String,
    source_seq: Option<i64>,
    category: String,
    event_type: String,
    severity: String,
    correlation_id: Option<String>,
    payload_json: String,
    attachments_json: Option<String>,
    pii: i32,
    retention_class: String,
}

impl EventRow {
    fn into_event(self) -> Result<Event> {
        use chrono::TimeZone;

        let observed_at = Utc.timestamp_millis_opt(self.observed_at).single().unwrap_or_else(Utc::now);
        let received_at = Utc.timestamp_millis_opt(self.received_at).single().unwrap_or_else(Utc::now);

        let data: serde_json::Value = serde_json::from_str(&self.payload_json)?;
        let attachments: Option<Vec<crate::event::Attachment>> = self
            .attachments_json
            .as_ref()
            .map(|s| serde_json::from_str(s))
            .transpose()?;

        Ok(Event {
            event_id: self.event_id,
            observed_at,
            received_at,
            source: crate::event::Source {
                source_type: self.source_type,
                id: self.source_id,
                version: None,
                metadata: None,
            },
            event: crate::event::EventDetails {
                category: self.category,
                event_type: self.event_type,
                severity: self.severity,
                schema_version: None,
                data,
            },
            correlation: self.correlation_id.map(|id| crate::event::Correlation {
                correlation_id: Some(id),
                session_id: None,
                incident_id: None,
            }),
            attachments,
            privacy: Some(crate::event::Privacy {
                pii: self.pii != 0,
                retention_class: self.retention_class,
            }),
            sync: Some(crate::event::SyncStatus {
                synced: false,
                source_seq: self.source_seq,
            }),
        })
    }
}

use chrono::Utc;

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn make_test_event(event_type: &str) -> Event {
        Event {
            event_id: uuid::Uuid::new_v4().to_string(),
            observed_at: Utc::now(),
            received_at: Utc::now(),
            source: crate::event::Source {
                source_type: "browser".to_string(),
                id: "test-session".to_string(),
                version: Some("1.0".to_string()),
                metadata: None,
            },
            event: crate::event::EventDetails {
                category: "web".to_string(),
                event_type: event_type.to_string(),
                severity: "info".to_string(),
                schema_version: None,
                data: serde_json::json!({"path": "/test"}),
            },
            correlation: None,
            attachments: None,
            privacy: None,
            sync: None,
        }
    }

    #[test]
    fn test_open_and_migrate() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::open(&db_path).unwrap();
        db.migrate().unwrap();
        assert_eq!(db.event_count().unwrap(), 0);
    }

    #[test]
    fn test_insert_and_count() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::open(&db_path).unwrap();
        db.migrate().unwrap();

        let event = make_test_event("page_view");
        db.insert_event(&event).unwrap();

        assert_eq!(db.event_count().unwrap(), 1);
        assert_eq!(db.pending_sync_count().unwrap(), 1);
    }

    #[test]
    fn test_insert_batch() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::open(&db_path).unwrap();
        db.migrate().unwrap();

        let events: Vec<Event> = (0..10)
            .map(|i| make_test_event(&format!("event_{}", i)))
            .collect();

        let count = db.insert_events(&events).unwrap();
        assert_eq!(count, 10);
        assert_eq!(db.event_count().unwrap(), 10);
    }

    #[test]
    fn test_get_unsynced_and_mark_synced() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::open(&db_path).unwrap();
        db.migrate().unwrap();

        // Insert events
        let events: Vec<Event> = (0..5)
            .map(|i| make_test_event(&format!("event_{}", i)))
            .collect();
        db.insert_events(&events).unwrap();

        // Get unsynced
        let unsynced = db.get_unsynced_events(10).unwrap();
        assert_eq!(unsynced.len(), 5);

        // Mark first 3 as synced
        let ids: Vec<String> = unsynced.iter().take(3).map(|e| e.event_id.clone()).collect();
        db.mark_synced(&ids).unwrap();

        // Check counts
        assert_eq!(db.event_count().unwrap(), 5);
        assert_eq!(db.pending_sync_count().unwrap(), 2);

        // Get unsynced again
        let unsynced2 = db.get_unsynced_events(10).unwrap();
        assert_eq!(unsynced2.len(), 2);
    }

    #[test]
    fn test_idempotent_insert() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::open(&db_path).unwrap();
        db.migrate().unwrap();

        let event = make_test_event("page_view");
        db.insert_event(&event).unwrap();
        db.insert_event(&event).unwrap(); // Same event_id

        assert_eq!(db.event_count().unwrap(), 1); // Should still be 1
    }
}
