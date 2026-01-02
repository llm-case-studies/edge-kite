# Contributing to EdgeKite

Thank you for your interest in contributing to EdgeKite!

## Development Setup

### Prerequisites

- Rust 1.75+ (for edge agent)
- Node.js 20+ (for UI development)
- SQLite 3.x
- Docker (optional, for testing)

### Getting Started

```bash
# Clone the repo
git clone https://github.com/YOUR_ORG/edge-kite.git
cd edge-kite

# Build the edge agent
cd edge
cargo build

# Run tests
cargo test

# Run the agent locally
cargo run -- --config ../examples/dev-config.toml
```

## Project Structure

```
edge-kite/
├── edge/           # Rust edge agent
│   ├── src/        # Source code
│   └── ui/         # Embedded SPA dashboard
├── hub/            # Hub service (future)
├── sdk/            # Client SDKs
│   ├── js/         # Web tracker
│   └── python/     # IoT/edge SDK
├── docs/           # Documentation
└── examples/       # Example configurations
```

## Code Style

### Rust
- Follow standard Rust conventions
- Use `cargo fmt` before committing
- Use `cargo clippy` to catch common issues

### JavaScript/TypeScript
- Use Prettier for formatting
- ESLint for linting

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`cargo test`)
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add batch ingestion endpoint
fix: handle clock drift in event timestamps
docs: update deployment guide for Raspberry Pi
refactor: extract sync logic into separate module
```

## Reporting Issues

- Use GitHub Issues
- Include reproduction steps
- Include environment details (OS, Rust version, hardware)

## Questions?

Open a Discussion on GitHub or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
