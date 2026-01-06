//! HTTP server for EdgeKite

use axum::{
    extract::{Json, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use sysinfo::System;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;

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

/// OpenAPI documentation
#[derive(OpenApi)]
#[openapi(
    info(
        title = "EdgeKite API",
        version = "0.1.0",
        description = "Lightweight, offline-first analytics agent for edge deployments",
        license(name = "MIT", url = "https://opensource.org/licenses/MIT"),
    ),
    paths(
        ingest_event,
        ingest_batch,
        recent_events,
        health,
        stats,
        resources,
    ),
    components(schemas(
        IngestResponse,
        RejectedEvent,
        HealthResponse,
        StatsResponse,
        ResourcesResponse,
        IncomingEventSchema,
        EventSchema,
    )),
    tags(
        (name = "events", description = "Event ingestion and retrieval"),
        (name = "monitoring", description = "Health and resource monitoring"),
    )
)]
struct ApiDoc;

/// Run the HTTP server
pub async fn run(config: ServerConfig, db: Database, db_path: PathBuf) -> Result<()> {
    let state = Arc::new(AppState { db, db_path });

    let mut app = Router::new()
        // Event ingestion
        .route("/api/events", post(ingest_event))
        .route("/api/events/batch", post(ingest_batch))
        .route("/api/events/recent", get(recent_events))
        // API endpoints
        .route("/api/health", get(health))
        .route("/api/stats", get(stats))
        .route("/api/resources", get(resources))
        // Swagger UI
        .merge(SwaggerUi::new("/api/docs").url("/api/openapi.json", ApiDoc::openapi()))
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

    let listener = tokio::net::TcpListener::bind(&config.listen).await?;
    info!("Server listening on {}", config.listen);
    info!("API docs available at http://{}/api/docs", config.listen);

    axum::serve(listener, app).await?;

    Ok(())
}

/// Ingest a single event
#[utoipa::path(
    post,
    path = "/api/events",
    tag = "events",
    request_body = IncomingEventSchema,
    responses(
        (status = 202, description = "Event accepted", body = IngestResponse),
        (status = 500, description = "Internal error", body = IngestResponse),
    )
)]
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
#[utoipa::path(
    post,
    path = "/api/events/batch",
    tag = "events",
    request_body = Vec<IncomingEventSchema>,
    responses(
        (status = 202, description = "Events accepted", body = IngestResponse),
        (status = 500, description = "Internal error", body = IngestResponse),
    )
)]
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
#[utoipa::path(
    get,
    path = "/api/health",
    tag = "monitoring",
    responses(
        (status = 200, description = "Health status", body = HealthResponse),
    )
)]
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

/// Get event statistics
#[utoipa::path(
    get,
    path = "/api/stats",
    tag = "monitoring",
    responses(
        (status = 200, description = "Event statistics", body = StatsResponse),
    )
)]
async fn stats(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let event_count = state.db.event_count().unwrap_or(0);
    let pending_sync = state.db.pending_sync_count().unwrap_or(0);
    let sources = state.db.source_count().unwrap_or(0);

    Json(StatsResponse {
        total_events: event_count,
        pending_sync,
        sources,
    })
}

/// Query parameters for recent events
#[derive(Deserialize, utoipa::IntoParams)]
struct RecentParams {
    /// Maximum number of events to return (default: 100, max: 500)
    limit: Option<usize>,
    /// Filter by event category
    category: Option<String>,
    /// Filter by source ID
    source: Option<String>,
}

/// Get recent events for dashboard
#[utoipa::path(
    get,
    path = "/api/events/recent",
    tag = "events",
    params(RecentParams),
    responses(
        (status = 200, description = "Recent events", body = Vec<EventSchema>),
        (status = 500, description = "Internal error"),
    )
)]
async fn recent_events(
    State(state): State<Arc<AppState>>,
    Query(params): Query<RecentParams>,
) -> impl IntoResponse {
    let limit = params.limit.unwrap_or(100).min(500); // Cap at 500

    match state.db.get_recent_events(
        limit,
        params.category.as_deref(),
        params.source.as_deref(),
    ) {
        Ok(events) => {
            // Convert to JSON-serializable format
            let response: Vec<serde_json::Value> = events
                .into_iter()
                .map(|e| {
                    serde_json::json!({
                        "event_id": e.event_id,
                        "observed_at": e.observed_at.to_rfc3339(),
                        "source": {
                            "type": e.source.source_type,
                            "id": e.source.id,
                        },
                        "event": {
                            "category": e.event.category,
                            "type": e.event.event_type,
                            "severity": e.event.severity,
                            "data": e.event.data,
                        }
                    })
                })
                .collect();

            (StatusCode::OK, Json(response))
        }
        Err(e) => {
            let error = serde_json::json!({
                "error": e.to_string()
            });
            (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![error]))
        }
    }
}

/// Resource monitoring endpoint
#[utoipa::path(
    get,
    path = "/api/resources",
    tag = "monitoring",
    responses(
        (status = 200, description = "Resource usage", body = ResourcesResponse),
    )
)]
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

// Response types with OpenAPI schemas

#[derive(Serialize, ToSchema)]
struct IngestResponse {
    /// List of accepted event IDs
    accepted: Vec<String>,
    /// List of rejected events with reasons
    rejected: Vec<RejectedEvent>,
}

#[derive(Serialize, ToSchema)]
struct RejectedEvent {
    /// The event ID that was rejected (if available)
    event_id: Option<String>,
    /// Reason for rejection
    reason: String,
}

#[derive(Serialize, ToSchema)]
struct HealthResponse {
    /// Service status
    status: String,
    /// EdgeKite version
    version: String,
    /// Total events in database
    event_count: i64,
    /// Events pending sync to hub
    pending_sync: i64,
}

#[derive(Serialize, ToSchema)]
struct StatsResponse {
    /// Total events stored
    total_events: i64,
    /// Events pending sync
    pending_sync: i64,
    /// Number of unique sources
    sources: i64,
}

#[derive(Serialize, ToSchema)]
struct ResourcesResponse {
    /// CPU usage percentage
    cpu_percent: f32,
    /// RAM usage in MB
    ram_mb: f64,
    /// Database file size in MB
    db_size_mb: f64,
    /// Sync connection status
    sync_status: String,
}

/// Schema for incoming events (for OpenAPI docs)
#[derive(Serialize, Deserialize, ToSchema)]
struct IncomingEventSchema {
    /// Optional event ID (generated if not provided)
    event_id: Option<String>,
    /// When the event was observed (ISO 8601)
    observed_at: Option<String>,
    /// Event source information
    source: SourceSchema,
    /// Event details
    event: EventDetailsSchema,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct SourceSchema {
    /// Source type: browser, edge_device, server
    #[serde(rename = "type")]
    source_type: String,
    /// Unique source identifier
    id: String,
    /// Source version
    version: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct EventDetailsSchema {
    /// Event category: web, iot, ops, security
    category: String,
    /// Event type (e.g., page_view, temperature_reading)
    #[serde(rename = "type")]
    event_type: String,
    /// Severity: debug, info, warn, error, critical
    severity: Option<String>,
    /// Event-specific payload
    data: serde_json::Value,
}

/// Schema for returned events
#[derive(Serialize, ToSchema)]
struct EventSchema {
    /// Unique event ID
    event_id: String,
    /// When the event was observed
    observed_at: String,
    /// Event source
    source: SourceSchema,
    /// Event details
    event: EventDetailsSchema,
}
