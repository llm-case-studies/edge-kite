//! Sync worker for EdgeKite
//!
//! Implements the outbox pattern: reads unsynced events from SQLite,
//! batches them, sends to hub, and marks as synced on success.

use std::time::Duration;
use tokio::task::JoinHandle;
use tracing::{debug, error, info, warn};

use crate::config::SyncConfig;
use crate::db::Database;
use crate::event::Event;

/// Start the sync worker
pub fn start_worker(db: Database, config: SyncConfig) -> JoinHandle<()> {
    tokio::spawn(async move {
        let client = reqwest::Client::new();
        let mut consecutive_failures = 0u32;

        loop {
            // Check for unsynced events
            match db.get_unsynced_events(config.batch_size) {
                Ok(events) if events.is_empty() => {
                    // Nothing to sync, wait and check again
                    debug!("No events to sync");
                    tokio::time::sleep(Duration::from_secs(config.interval_seconds)).await;
                    continue;
                }
                Ok(events) => {
                    let count = events.len();
                    debug!("Syncing {} events to hub", count);

                    match sync_batch(&client, &config, &events).await {
                        Ok(accepted_ids) => {
                            // Mark as synced
                            match db.mark_synced(&accepted_ids) {
                                Ok(marked) => {
                                    info!("Synced {} events to hub", marked);
                                    consecutive_failures = 0;
                                }
                                Err(e) => {
                                    error!("Failed to mark events as synced: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            consecutive_failures += 1;
                            warn!(
                                "Sync failed (attempt {}): {}",
                                consecutive_failures, e
                            );

                            // Exponential backoff
                            if consecutive_failures < config.retry_max_attempts {
                                let delay = calculate_backoff(
                                    consecutive_failures,
                                    config.retry_base_delay_ms,
                                );
                                debug!("Retrying in {} ms", delay);
                                tokio::time::sleep(Duration::from_millis(delay)).await;
                            } else {
                                error!(
                                    "Max retry attempts ({}) reached, waiting for next interval",
                                    config.retry_max_attempts
                                );
                                consecutive_failures = 0;
                                tokio::time::sleep(Duration::from_secs(config.interval_seconds))
                                    .await;
                            }
                            continue;
                        }
                    }
                }
                Err(e) => {
                    error!("Failed to get unsynced events: {}", e);
                }
            }

            // Wait before next sync cycle
            tokio::time::sleep(Duration::from_secs(config.interval_seconds)).await;
        }
    })
}

/// Sync a batch of events to the hub
async fn sync_batch(
    client: &reqwest::Client,
    config: &SyncConfig,
    events: &[Event],
) -> Result<Vec<String>, String> {
    let url = format!("{}/api/ingest/batch", config.hub_url.trim_end_matches('/'));

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", config.api_key))
        .header("Content-Type", "application/json")
        .json(events)
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    if response.status().is_success() {
        let result: SyncResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(result.accepted)
    } else {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        Err(format!("Hub returned {}: {}", status, body))
    }
}

/// Calculate exponential backoff delay
fn calculate_backoff(attempt: u32, base_delay_ms: u64) -> u64 {
    let max_delay = 5 * 60 * 1000; // 5 minutes max
    let delay = base_delay_ms * 2u64.pow(attempt.saturating_sub(1));
    delay.min(max_delay)
}

/// Response from hub sync endpoint
#[derive(serde::Deserialize)]
struct SyncResponse {
    accepted: Vec<String>,
    #[allow(dead_code)]
    rejected: Option<Vec<RejectedEvent>>,
}

#[derive(serde::Deserialize)]
#[allow(dead_code)]
struct RejectedEvent {
    event_id: Option<String>,
    reason: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backoff_calculation() {
        assert_eq!(calculate_backoff(1, 1000), 1000);
        assert_eq!(calculate_backoff(2, 1000), 2000);
        assert_eq!(calculate_backoff(3, 1000), 4000);
        assert_eq!(calculate_backoff(4, 1000), 8000);
        assert_eq!(calculate_backoff(10, 1000), 300000); // Capped at 5 min
    }
}
