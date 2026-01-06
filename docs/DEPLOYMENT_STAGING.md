# Staging Deployment (4c8g)

This repo deploys a **static SPA** (mock data) to the IONOS 4c8g VPS. The Rust
backend is not part of staging yet.

## Workflow

Workflow file:

- `.github/workflows/deploy-staging.yml`

Trigger:

- Push to `staging` branch (or manual `workflow_dispatch`).

Build:

- `web/` with `npm install` + `npm run build`
- Outputs `web/dist/` (Vite).

Deploy:

- rsync to `/home/proxyuser/www/edge-kite-staging`
- Served by staging nginx on `https://staging.edge-kite.com`

## Secrets (GitHub)

Required repository secrets:

- `IONOS_HOST` → `67.217.244.108`
- `IONOS_USER` → `proxyuser`
- `IONOS_SSH_KEY` → private key with access to the VPS

## Nginx (VPS)

Staging config lives on the server at:

- `/home/proxyuser/nginx-config-staging/conf.d/edge-kite-staging.conf`

Prod nginx proxies `staging.edge-kite.com` to the staging container on port 8080.

## Notes

- `web/index.html` must include `<script type="module" src="/index.tsx"></script>`
  so Vite generates JS assets.
- `web/services/gemini.ts` guards missing API keys; AI stays offline if no
  `GEMINI_API_KEY` is provided.

## Local API Test (8080)

The repo is on external storage, so builds should use a temp target dir:

```bash
cd /media/alex/LargeStorage/Projects/edge-kite/edge
export CARGO_TARGET_DIR=/tmp/edge-kite-target
cargo build --release

/tmp/edge-kite-target/release/edge-kite \
  --listen 127.0.0.1:8080 \
  --data-dir /tmp/edge-kite-data
```

Swagger UI (local):

- http://127.0.0.1:8080/api/docs
