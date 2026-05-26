#!/bin/bash
# Hermes Dashboard — Start script
# Launches metrics server + Vite dev server

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
METRICS_PORT="${METRICS_PORT:-9192}"

echo "╔══════════════════════════════════════════╗"
echo "║       Hermes Dashboard Startup           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Metrics Server ────────────────────────────────────────────────────────
echo "📊 Starting metrics server on port $METRICS_PORT..."
python3 "$SCRIPT_DIR/metrics_server.py" --port "$METRICS_PORT" &
METRICS_PID=$!
echo "   PID: $METRICS_PID"

# Wait for metrics server to be ready
for i in {1..10}; do
  if curl -s "http://localhost:$METRICS_PORT/health" > /dev/null 2>&1; then
    echo "   ✅ Metrics server ready"
    break
  fi
  sleep 0.5
done

# ── Vite Dev Server ───────────────────────────────────────────────────────
echo ""
echo "⚡ Starting Vite dev server..."
echo ""
cd "$SCRIPT_DIR"
npx vite --host 0.0.0.0 &
VITE_PID=$!

# Cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Shutting down..."
  kill $METRICS_PID 2>/dev/null
  kill $VITE_PID 2>/dev/null
  wait
  echo "Done."
}
trap cleanup EXIT INT TERM

wait
