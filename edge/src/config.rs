//! Configuration handling for EdgeKite

use serde::Deserialize;
use std::path::{Path, PathBuf};

use crate::error::Result;

/// Main configuration struct
#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    /// Data directory for SQLite and media
    #[serde(default = "default_data_dir")]
    pub data_dir: PathBuf,

    /// HTTP server configuration
    #[serde(default)]
    pub server: ServerConfig,

    /// Sync configuration
    #[serde(default)]
    pub sync: SyncConfig,

    /// Retention configuration (used by cleanup worker)
    #[serde(default)]
    #[allow(dead_code)]
    pub retention: RetentionConfig,
}

/// HTTP server configuration
#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    /// Listen address
    #[serde(default = "default_listen")]
    pub listen: String,

    /// Enable CORS
    #[serde(default = "default_true")]
    pub cors_enabled: bool,

    /// Path to static UI files (used when SPA is added)
    #[allow(dead_code)]
    pub ui_path: Option<PathBuf>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SyncConfig {
    /// Enable sync to hub
    #[serde(default)]
    pub enabled: bool,

    /// Hub URL
    #[serde(default)]
    pub hub_url: String,

    /// API key for hub authentication
    #[serde(default)]
    pub api_key: String,

    /// Batch size for sync
    #[serde(default = "default_batch_size")]
    pub batch_size: usize,

    /// Sync interval in seconds
    #[serde(default = "default_sync_interval")]
    pub interval_seconds: u64,

    /// Maximum retry attempts
    #[serde(default = "default_max_retries")]
    pub retry_max_attempts: u32,

    /// Base delay for retry backoff (ms)
    #[serde(default = "default_retry_delay")]
    pub retry_base_delay_ms: u64,
}

/// Retention configuration (for cleanup worker)
#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct RetentionConfig {
    /// Days to retain events locally
    #[serde(default = "default_retention_days")]
    pub events_days: u32,

    /// Days to retain media locally
    #[serde(default = "default_media_days")]
    pub media_days: u32,

    /// Run cleanup at this hour (0-23)
    #[serde(default = "default_cleanup_hour")]
    pub cleanup_hour: u32,
}

// Default value functions
fn default_data_dir() -> PathBuf {
    PathBuf::from("./data")
}

fn default_listen() -> String {
    "0.0.0.0:8080".to_string()
}

fn default_true() -> bool {
    true
}

fn default_batch_size() -> usize {
    100
}

fn default_sync_interval() -> u64 {
    30
}

fn default_max_retries() -> u32 {
    10
}

fn default_retry_delay() -> u64 {
    1000
}

fn default_retention_days() -> u32 {
    30
}

fn default_media_days() -> u32 {
    7
}

fn default_cleanup_hour() -> u32 {
    3
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            listen: default_listen(),
            cors_enabled: true,
            ui_path: None,
        }
    }
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            hub_url: String::new(),
            api_key: String::new(),
            batch_size: default_batch_size(),
            interval_seconds: default_sync_interval(),
            retry_max_attempts: default_max_retries(),
            retry_base_delay_ms: default_retry_delay(),
        }
    }
}

impl Default for RetentionConfig {
    fn default() -> Self {
        Self {
            events_days: default_retention_days(),
            media_days: default_media_days(),
            cleanup_hour: default_cleanup_hour(),
        }
    }
}

impl Config {
    /// Load configuration from file
    pub fn load(path: &Path) -> Result<Self> {
        let builder = config::Config::builder()
            .add_source(config::File::from(path).required(false))
            .add_source(config::Environment::with_prefix("EDGEKITE").separator("__"));

        let config = builder.build()?;
        Ok(config.try_deserialize()?)
    }
}
