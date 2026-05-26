#!/usr/bin/env python3
"""
System metrics server for the Hermes Dashboard.
Serves real-time Linux system metrics as JSON for the React frontend.

Usage: python3 metrics_server.py [--port 9192]

Endpoints:
  GET /api/metrics           — all current metrics (CPU, memory, disk, temp, uptime, network)
  GET /api/metrics/history/<metric>?hours=24  — time-series history for charting
  GET /health                — health check
  GET /                      — SSE stream of metrics updates (every 2 seconds)

Runs on port 9192 by default.
Zero dependencies — uses only Python stdlib.
"""

import http.server
import json
import os
import re
import signal
import sys
import threading
import time
from pathlib import Path


# ── Data collectors ────────────────────────────────────────────────────────

def read_file(path, default='0'):
    """Read a file, return stripped content or default."""
    try:
        with open(path) as f:
            return f.read().strip()
    except (OSError, PermissionError):
        return default

def get_cpu_usage():
    """Return CPU usage percentage via /proc/stat (first reading is garbage, keep state)."""
    try:
        with open('/proc/stat') as f:
            line = f.readline()
        parts = line.split()
        if parts[0] != 'cpu':
            return 0
        user, nice, system, idle = map(int, parts[1:5])
        total = user + nice + system + idle
        used = total - idle
        # Store previous for delta calculation
        prev = get_cpu_usage._prev
        get_cpu_usage._prev = (total, used)
        if prev is None:
            return 0
        prev_total, prev_used = prev
        delta_total = total - prev_total
        delta_used = used - prev_used
        return round((delta_used / delta_total) * 100, 1) if delta_total > 0 else 0
    except Exception:
        return 0

get_cpu_usage._prev = None

def get_memory_usage():
    """Return memory usage percentage from /proc/meminfo."""
    try:
        meminfo = {}
        with open('/proc/meminfo') as f:
            for line in f:
                parts = line.split(':')
                if len(parts) == 2:
                    key = parts[0].strip()
                    val = int(parts[1].strip().split()[0])
                    meminfo[key] = val
        total = meminfo.get('MemTotal', 1)
        available = meminfo.get('MemAvailable', 0)
        if 'MemAvailable' not in meminfo:
            free = meminfo.get('MemFree', 0)
            buffers = meminfo.get('Buffers', 0)
            cached = meminfo.get('Cached', 0)
            available = free + buffers + cached
        used = total - available
        return round((used / total) * 100, 1) if total > 0 else 0
    except Exception:
        return 0

def get_disk_usage():
    """Return disk usage percentage of the root filesystem."""
    try:
        stat = os.statvfs('/')
        total = stat.f_blocks * stat.f_frsize
        available = stat.f_bavail * stat.f_frsize
        used = total - available
        return round((used / total) * 100, 1) if total > 0 else 0
    except Exception:
        return 0

def get_temperature():
    """Return CPU temperature in Celsius from thermal zone."""
    # Try common Raspberry Pi thermal zone path first
    paths = [
        '/sys/class/thermal/thermal_zone0/temp',
        '/sys/class/hwmon/hwmon0/temp1_input',
        '/sys/class/hwmon/hwmon1/temp1_input',
    ]
    for p in paths:
        val = read_file(p)
        if val and val != '0':
            try:
                temp = int(val)
                # thermal_zone reports in millidegrees
                if temp > 1000:
                    temp = temp / 1000
                return round(temp, 1)
            except ValueError:
                continue
    return 0

def get_uptime():
    """Return system uptime in hours."""
    try:
        with open('/proc/uptime') as f:
            uptime_seconds = float(f.readline().split()[0])
        return round(uptime_seconds / 3600, 1)
    except Exception:
        return 0

def get_network():
    """Return network RX/TX bytes from /proc/net/dev (first suitable interface)."""
    try:
        with open('/proc/net/dev') as f:
            lines = f.readlines()
        rx_total = 0
        tx_total = 0
        for line in lines[2:]:  # Skip headers
            if ':' in line:
                parts = line.split(':')[1].split()
                if len(parts) >= 10:
                    rx_total += int(parts[0])
                    tx_total += int(parts[8])
        # Store previous for rate calculation (bytes/sec)
        now = time.time()
        prev = get_network._prev
        get_network._prev = (now, rx_total, tx_total)
        if prev is None:
            return {'rx': 0, 'tx': 0}
        prev_time, prev_rx, prev_tx = prev
        delta = now - prev_time
        if delta <= 0:
            return {'rx': 0, 'tx': 0}
        rx_rate = int((rx_total - prev_rx) / delta)
        tx_rate = int((tx_total - prev_tx) / delta)
        return {'rx': rx_rate, 'tx': tx_rate}
    except Exception:
        return {'rx': 0, 'tx': 0}

get_network._prev = None


# ── Metrics collection ─────────────────────────────────────────────────────

def collect_metrics():
    """Gather all current system metrics."""
    return {
        'cpu': get_cpu_usage(),
        'memory': get_memory_usage(),
        'disk': get_disk_usage(),
        'temperature': get_temperature(),
        'uptime': get_uptime(),
        'network': get_network(),
        'timestamp': time.time(),
    }

# ── History buffer ─────────────────────────────────────────────────────────
# Simple in-memory ring buffer for chart history (last N points)
MAX_HISTORY = 360  # 24 hours at 4-min intervals in dev, more in production
history_lock = threading.Lock()
history_buffer = {
    'cpu': [],
    'memory': [],
    'temperature': [],
}

def record_history():
    """Snapshot metrics into history buffer every 10 seconds."""
    while True:
        time.sleep(10)
        m = collect_metrics()
        ts = time.strftime('%H:%M')
        with history_lock:
            for metric in ['cpu', 'memory', 'temperature']:
                history_buffer[metric].append({'time': ts, 'value': m[metric]})
                if len(history_buffer[metric]) > MAX_HISTORY:
                    history_buffer[metric] = history_buffer[metric][-MAX_HISTORY:]

# Start history recorder in background
_history_thread = threading.Thread(target=record_history, daemon=True)
_history_thread.start()


# ── HTTP Server ────────────────────────────────────────────────────────────

class MetricsHandler(http.server.BaseHTTPRequestHandler):
    """Handle API requests for system metrics."""

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_sse(self):
        """Send Server-Sent Events headers."""
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]

        if path == '/health':
            self._send_json({'status': 'ok', 'service': 'metrics-server'})

        elif path == '/api/metrics':
            self._send_json(collect_metrics())

        elif path.startswith('/api/metrics/history/'):
            metric = path.split('/')[-1]
            if metric in history_buffer:
                with history_lock:
                    data = list(history_buffer[metric][-72:])  # last 12 hours (at 10s intervals)
                    # Reduce to ~24 points for chart display
                    step = max(1, len(data) // 24)
                    reduced = data[::step]
                    labels = [p['time'] for p in reduced]
                    values = [p['value'] for p in reduced]
                self._send_json({'labels': labels, 'values': values})
            else:
                self._send_json({'error': f'Unknown metric: {metric}'}, status=400)

        elif path == '/':
            # SSE stream — push metrics every 2 seconds
            self._send_sse()
            try:
                while True:
                    data = json.dumps(collect_metrics())
                    self.wfile.write(f'data: {data}\n\n'.encode('utf-8'))
                    self.wfile.flush()
                    time.sleep(2)
            except (BrokenPipeError, ConnectionResetError):
                pass

        else:
            self._send_json({'error': 'Not found'}, status=404)

    def log_message(self, format, *args):
        """Silence default logging."""
        pass


def main():
    port = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[1] == '--port' else 9192

    # Prime CPU counter
    get_cpu_usage()
    time.sleep(0.5)
    get_cpu_usage()  # First real reading after priming

    # Prime network counter
    get_network()
    time.sleep(0.5)
    get_network()

    server = http.server.HTTPServer(('0.0.0.0', port), MetricsHandler)
    print(f'⚡ Metrics server running on http://0.0.0.0:{port}')
    print(f'   /api/metrics          — current metrics')
    print(f'   /api/metrics/history/X — history for charting')
    print(f'   /                     — SSE stream')
    print(f'   /health               — health check')

    def shutdown(sig, frame):
        print('\nShutting down...')
        server.shutdown()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
