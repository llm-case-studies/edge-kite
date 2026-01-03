//! EdgeKite - Lightweight, offline-first analytics agent
//!
//! This is the main entry point for the edge agent.

use clap::Parser;
use std::path::PathBuf;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

mod config;
mod db;
mod error;
mod event;
mod server;
mod sync;

use config::Config;
use error::Result;

#[derive(Parser, Debug)]
#[command(name = "edge-kite")]
#[command(author = "EdgeKite Contributors")]
#[command(version)]
#[command(about = "Lightweight, offline-first analytics agent", long_about = None)]
struct Args {
    /// Path to configuration file
    #[arg(short, long, default_value = "config.toml")]
    config: PathBuf,

    /// Data directory (overrides config)
    #[arg(short, long)]
    data_dir: Option<PathBuf>,

    /// Listen address (overrides config)
    #[arg(short, long)]
    listen: Option<String>,

    /// Enable verbose logging
    #[arg(short, long)]
    verbose: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    // Initialize logging
    let level = if args.verbose { Level::DEBUG } else { Level::INFO };
    FmtSubscriber::builder()
        .with_max_level(level)
        .with_target(false)
        .compact()
        .init();

    info!("EdgeKite v{}", env!("CARGO_PKG_VERSION"));

    // Load configuration
    let mut config = Config::load(&args.config)?;

    // Apply CLI overrides
    if let Some(data_dir) = args.data_dir {
        config.data_dir = data_dir;
    }
    if let Some(listen) = args.listen {
        config.server.listen = listen;
    }

    info!("Data directory: {:?}", config.data_dir);
    info!("Listening on: {}", config.server.listen);

    // Initialize database
    let db_path = config.data_dir.join("events.db");
    let db = db::Database::open(&db_path)?;
    db.migrate()?;

    // Start sync worker (if enabled)
    let sync_handle = if config.sync.enabled {
        info!("Sync enabled, hub: {}", config.sync.hub_url);
        Some(sync::start_worker(db.clone(), config.sync.clone()))
    } else {
        info!("Sync disabled (offline mode)");
        None
    };

    // Start HTTP server
    server::run(config.server, db, db_path).await?;

    // Cleanup
    if let Some(handle) = sync_handle {
        handle.abort();
    }

    Ok(())
}
