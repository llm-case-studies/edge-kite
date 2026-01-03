//! HTTP server for EdgeKite

use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;
use sysinfo::System;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

use crate::config::ServerConfig;
use crate::db::Database;
use crate::error::Result;
use crate::event::{Event, IncomingEvent};

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    db: Database,
    db_path: PathBuf,
}

/// Run the HTTP server
pub async fn run(config: ServerConfig, db: Database, db_path: PathBuf) -> Result<()> {
    let state = Arc::new(AppState { db, db_path });

    let mut app = Router::new()
        // Event ingestion
        .route("/api/events", post(ingest_event))
        .route("/api/events/batch", post(ingest_batch))
        // API endpoints
        .route("/api/health", get(health))
        .route("/api/stats", get(stats))
        .route("/api/resources", get(resources))
        // TODO: Add timeline, query, SSE endpoints
        .with_state(state);

    // Add CORS if enabled
    if config.cors_enabled {
        app = app.layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );
    }

    // TODO: Add static file serving for SPA

    let listener = tokio::net::TcpListener::bind(&config.listen).await?;
    info!("Server listening on {}", config.listen);

    axum::serve(listener, app).await?;

    Ok(())
}

/// Ingest a single event
async fn ingest_event(
    State(state): State<Arc<AppState>>,
    Json(incoming): Json<IncomingEvent>,
) -> impl IntoResponse {
    let event = incoming.into_event();

    match state.db.insert_event(&event) {
        Ok(_) => (
            StatusCode::ACCEPTED,
            Json(IngestResponse {
                accepted: vec![event.event_id],
                rejected: vec![],
            }),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(IngestResponse {
                accepted: vec![],
                rejected: vec![RejectedEvent {
                    event_id: Some(event.event_id),
                    reason: e.to_string(),
                }],
            }),
        ),
    }
}

/// Ingest a batch of events
async fn ingest_batch(
    State(state): State<Arc<AppState>>,
    Json(incoming): Json<Vec<IncomingEvent>>,
) -> impl IntoResponse {
    let events: Vec<Event> = incoming.into_iter().map(|e| e.into_event()).collect();
    let event_ids: Vec<String> = events.iter().map(|e| e.event_id.clone()).collect();

    match state.db.insert_events(&events) {
        Ok(count) => (
            StatusCode::ACCEPTED,
            Json(IngestResponse {
                accepted: event_ids[..count].to_vec(),
                rejected: vec![],
            }),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(IngestResponse {
                accepted: vec![],
                rejected: vec![RejectedEvent {
                    event_id: None,
                    reason: e.to_string(),
                }],
            }),
        ),
    }
}

/// Health check endpoint
async fn health(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let event_count = state.db.event_count().unwrap_or(-1);
    let pending_sync = state.db.pending_sync_count().unwrap_or(-1);

    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        event_count,
        pending_sync,
    })
}

/// Stats endpoint
async fn stats(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let event_count = state.db.event_count().unwrap_or(0);
    let pending_sync = state.db.pending_sync_count().unwrap_or(0);

    Json(StatsResponse {
        total_events: event_count,
        pending_sync,
    })
}

/// Resource monitoring endpoint
async fn resources(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    // Get system info
    let mut sys = System::new();
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    // Calculate CPU usage (average across all cores)
    let cpu_percent = sys.cpus().iter().map(|c| c.cpu_usage()).sum::<f32>()
        / sys.cpus().len().max(1) as f32;

    // Get memory usage for this process
    let ram_bytes = sysinfo::get_current_pid()
        .ok()
        .and_then(|pid| {
            sys.refresh_processes(sysinfo::ProcessesToUpdate::Some(&[pid]));
            sys.process(pid).map(|p| p.memory())
        })
        .unwrap_or(0);

    // Get database file size
    let db_size_bytes = std::fs::metadata(&state.db_path)
        .map(|m| m.len())
        .unwrap_or(0);

    Json(ResourcesResponse {
        cpu_percent: (cpu_percent * 10.0).round() / 10.0, // 1 decimal place
        ram_mb: (ram_bytes as f64 / 1024.0 / 1024.0 * 10.0).round() / 10.0,
        db_size_mb: (db_size_bytes as f64 / 1024.0 / 1024.0 * 100.0).round() / 100.0,
        sync_status: "connected".to_string(), // TODO: get actual sync status
    })
}

// Response types

#[derive(Serialize)]
struct IngestResponse {
    accepted: Vec<String>,
    rejected: Vec<RejectedEvent>,
}

#[derive(Serialize)]
struct RejectedEvent {
    event_id: Option<String>,
    reason: String,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    event_count: i64,
    pending_sync: i64,
}

#[derive(Serialize)]
struct StatsResponse {
    total_events: i64,
    pending_sync: i64,
}

#[derive(Serialize)]
struct ResourcesResponse {
    cpu_percent: f32,
    ram_mb: f64,
    db_size_mb: f64,
    sync_status: String,
}
