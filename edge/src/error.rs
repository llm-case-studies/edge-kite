//! Error types for EdgeKite

use thiserror::Error;

/// Application error types
#[derive(Error, Debug)]
#[allow(dead_code)]
pub enum Error {
    #[error("Configuration error: {0}")]
    Config(#[from] config::ConfigError),

    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Invalid event: {0}")]
    InvalidEvent(String),

    #[error("Sync error: {0}")]
    Sync(String),
}

pub type Result<T> = std::result::Result<T, Error>;
