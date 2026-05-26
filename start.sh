#!/bin/bash
# Hermes Dashboard — Start script
# Launches metrics server + Vite dev server
# Cross-platform: macOS (arm64/x64) and Linux (arm64/x64)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
METRICS_PORT="${METRICS_PORT:-9192}"

echo "╔══════════════════════════════════════════╗"
echo "║       Hermes Dashboard Startup           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Dependency Check ────────────────────────────────────────────────────────
cd "$SCRIPT_DIR"

# Check if node_modules needs (re)install
NEEDS_INSTALL=false

if [ ! -d "node_modules" ] || [ ! -d "node_modules/vite" ]; then
  echo "📦 node_modules missing — installing dependencies..."
  NEEDS_INSTALL=true
elif ! node -e "require('vite')" 2>/dev/null; then
  echo "📦 Vite module broken (platform mismatch?) — reinstalling dependencies..."
  echo "   (this fixes the rolldown native binding error on different platforms)"
  rm -rf node_modules package-lock.json
  NEEDS_INSTALL=true
fi

if [ "$NEEDS_INSTALL" = true ]; then
  npm install
  echo "   ✅ Dependencies installed"
  echo ""
fi

# ── Metrics Server ────────────────────────────────────────────────────────
echo "📊 Starting metrics server on port $METRICS_PORT..."
python3 "$SCRIPT_DIR/metrics_server.py" --port "$METRICS_PORT" &
METRICS_PID=$!
echo "   PID: $METRICS_PID"

# Wait for metrics server to be ready
for i in {1..10}; do
  if curl -s "http://localhost:$METRICS_PORT/health" > /dev/null 2>&1; then
    echo "   ✅ Metrics server ready"
    echo ""
    echo "   Endpoints:"
    echo "   /api/metrics          — current metrics"
    echo "   /api/metrics/history/X — history for charting"
    echo "   /                     — SSE stream"
    echo "   /health               — health check"
    break
  fi
  sleep 0.5
done

# ── Vite Dev Server ───────────────────────────────────────────────────────
echo ""
echo "⚡ Starting Vite dev server..."
echo ""

# If Vite fails with native binding error, auto-fix and retry
npx vite --host 0.0.0.0 &
VITE_PID=$!

# Cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Shutting down..."
  kill $METRICS_PID 2>/dev/null
  kill $VITE_PID 2>/dev/null
  wait 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

wait
