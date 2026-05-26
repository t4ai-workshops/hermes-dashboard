# Hermes Dashboard

Real-time dashboard for Hermes Agent — system metrics, printer status, job monitoring.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  React Frontend  │────▶│  Vite Dev Server  │────▶│  Metrics Server   │
│  (port 5173)     │     │  (proxy)          │     │  (port 9192)      │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                                │                          │
                                │                          ├─ /api/metrics
                                │                          ├─ /api/metrics/history/:metric
                                │                          └─ SSE stream (/)
                                │
                                ▼
                        ┌──────────────────┐
                        │  Hermes Web       │
                        │  Dashboard (9119) │
                        │  /api/status      │
                        │  /api/sessions    │
                        └──────────────────┘
```

## Quick Start

```bash
# 1. Start the metrics server (reads real system data)
python3 metrics_server.py --port 9192 &

# 2. Start the React dev server (with Vite proxy)
npm run dev

# 3. Open http://localhost:5173
```

### Production Build

```bash
npm run build
# Output in dist/ — serve with any static file server
```

## Data Sources

| Source | Endpoint | Auth |
|--------|----------|------|
| Metrics Server (9192) | `/api/metrics`, `/api/metrics/history/:metric`, SSE | None |
| Hermes Dashboard (9119) | `/api/hermes/status`, `/api/hermes/sessions` | Session token |
| Hermes API (8642) | `/api/v1/*` | Bearer API key |

## Mock Mode

Set `MOCK_MODE = true` in `src/services/api.js` for offline development with realistic fake data.

## Tests

```bash
npm test           # Run once
npm run test:watch # Watch mode
```

## Widget Views

- **Overview** — System health at a glance (CPU, memory, disk, temp, network)
- **Printers** — Bambu/Prusa printer status with progress bars
- **System** — Detailed system metrics with history charts
- **Jobs** — Print job queue with printer and system widgets
- **Settings** — Configuration (placeholder for future config panels)
