#!/usr/bin/env python3
"""Hermes Dashboard Server v0.5 — serveert statische bestanden + live data API.
   Geen cron, geen data collector, geen data.json. Data rechtstreeks uit Hermes.
"""
import json, os, sqlite3, sys, platform, subprocess, yaml
from datetime import datetime, timezone
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

DASHBOARD = Path.home() / ".hermes" / "hermes-dashboard"
HERMES_HOME = Path.home() / ".hermes"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
DB_PATH = HERMES_HOME / "state.db"
CONFIG_PATH = HERMES_HOME / "config.yaml"
AUTH_PATH = HERMES_HOME / "auth.json"
ENV_PATH = HERMES_HOME / ".env"
LOG_DIR = HERMES_HOME / "logs"
PREF_PATH = DASHBOARD / "preferences.json"
API_URL = "http://localhost:8642"
API_KEY = "change-me-local-dev"


def safe_read_json(path):
    try: return json.loads(open(path).read())
    except: return {}


def safe_read_yaml(path):
    try: return yaml.safe_load(open(path).read())
    except: return {}


def get_session_stats():
    """Aantallen rechtstreeks uit state.db — live, geen cache."""
    if not DB_PATH.exists():
        return {"sessions": 0, "messages": 0}
    try:
        con = sqlite3.connect(str(DB_PATH))
        con.row_factory = sqlite3.Row
        cur = con.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {r[0] for r in cur.fetchall()}

        data = {"db_size_mb": round(DB_PATH.stat().st_size / 1048576, 1)}
        has_sessions = "sessions" in tables
        has_messages = "messages" in tables

        if has_sessions:
            cur.execute("SELECT COUNT(*) as c, COALESCE(SUM(message_count),0) as m, "
                        "COALESCE(SUM(tool_call_count),0) as tc, "
                        "COALESCE(SUM(input_tokens),0) as inp, "
                        "COALESCE(SUM(output_tokens),0) as outp, "
                        "COALESCE(SUM(estimated_cost_usd),0) as cost, "
                        "COALESCE(SUM(api_call_count),0) as api "
                        "FROM sessions")
            row = cur.fetchone()
            data["sessions"] = row["c"]
            data["messages"] = row["m"]
            data["tool_calls"] = row["tc"]
            data["input_tokens"] = row["inp"]
            data["output_tokens"] = row["outp"]
            data["estimated_cost_usd"] = round(row["cost"], 4)
            data["api_calls"] = row["api"]

            for src in ["telegram", "cli", "cron", "tui"]:
                cur.execute("SELECT COUNT(*) FROM sessions WHERE source=?", (src,))
                data[f"{src}_sessions"] = cur.fetchone()[0]

            cur.execute("SELECT id, started_at, source, title FROM sessions "
                        "ORDER BY started_at DESC LIMIT 1")
            row = cur.fetchone()
            if row:
                data["last_session"] = {"id": row["id"], "source": row["source"],
                                         "title": row["title"], "at": row["started_at"]}

            cur.execute("SELECT model, COUNT(*) as cnt, "
                        "COALESCE(SUM(input_tokens+output_tokens),0) as tokens, "
                        "COALESCE(SUM(estimated_cost_usd),0) as cost "
                        "FROM sessions WHERE model IS NOT NULL AND model != '' "
                        "GROUP BY model ORDER BY tokens DESC")
            data["models"] = [dict(r) for r in cur.fetchall()]

            today = datetime.now().timestamp() - 86400
            cur.execute("SELECT COUNT(*) as c, COALESCE(SUM(message_count),0) as m, "
                        "COALESCE(SUM(input_tokens+output_tokens),0) as t "
                        "FROM sessions WHERE started_at > ?", (today,))
            row = cur.fetchone()
            data["today"] = {"sessions": row["c"], "messages": row["m"], "tokens": row["t"]}

        if has_messages:
            cur.execute("SELECT role, COUNT(*) as cnt FROM messages GROUP BY role")
            data["messages_by_role"] = {r[0]: r[1] for r in cur.fetchall()}

        con.close()
        return data
    except Exception as e:
        return {"sessions": 0, "messages": 0, "error": str(e)}


def get_provider_config():
    """Providers uit config.yaml."""
    cfg = safe_read_yaml(CONFIG_PATH)
    if not cfg:
        return {}
    providers = {}
    model = cfg.get("model", {})
    providers["primary"] = {
        "name": model.get("default", "?"),
        "provider": model.get("provider", "?"),
        "base_url": model.get("base_url", "") or "(default)"
    }
    for name, p in cfg.get("providers", {}).items():
        providers[name] = {
            "models": list(p.get("models", {}).keys()) if isinstance(p.get("models"), dict) else [],
            "base_url": p.get("base_url", "?")[:60]
        }
    fallback = cfg.get("fallback_model", {})
    if fallback:
        providers["fallback"] = {
            "provider": fallback.get("provider", "?"),
            "model": fallback.get("model", "?")
        }
    return providers


def get_auth_status():
    """Credentials status uit auth.json + .env."""
    auth = safe_read_json(AUTH_PATH)
    pool = auth.get("credential_pool", {})
    creds = []
    for provider, keys in pool.items():
        for key in keys:
            creds.append({
                "provider": provider,
                "label": key.get("label", "?"),
                "type": key.get("auth_type", "?"),
                "status": "ok" if key.get("last_status") != "exhausted" else "exhausted",
                "last_error": key.get("last_error_reason", None),
                "base_url": key.get("base_url", "?")[:50]
            })
    env_configured = set()
    if ENV_PATH.exists():
        for line in open(ENV_PATH):
            if "=" in line and not line.startswith("#") and "API_KEY" in line.upper():
                key = line.split("=")[0].strip()
                val = line.split("=", 1)[1].strip().strip("'\"")
                if val and len(val) > 10:
                    env_configured.add(key.replace("_API_KEY", "").replace("_TOKEN", "").replace("_SECRET", ""))
    return {"credentials": creds, "env_keys_found": sorted(env_configured)}


def get_log_summary():
    """Error counts uit logs."""
    if not LOG_DIR.exists():
        return {}
    try:
        errors = 0
        warnings = 0
        quotas = 0
        for logfile in ["agent.log", "errors.log", "gateway.log"]:
            lp = LOG_DIR / logfile
            if lp.exists():
                content = open(lp, errors='ignore').read()
                errors += content.count(" ERROR ")
                warnings += content.count(" WARNING ")
                quotas += content.count("429") + content.count("quota")
        sizes = {}
        for f in LOG_DIR.iterdir():
            if f.is_file():
                sizes[f.name] = round(f.stat().st_size / 1024, 1)
        return {"errors": errors, "warnings": warnings, "quota_hits": quotas, "log_sizes_kb": sizes}
    except:
        return {}


def get_insights():
    """Data uit hermes insights — live elke refresh."""
    try:
        result = subprocess.run(
            ["hermes", "insights", "--days", "30"],
            capture_output=True, text=True, timeout=15,
            env={**os.environ, "HERMES_HOME": str(HERMES_HOME)}
        )
        output = result.stdout
        insights = {}
        for line in output.split("\n"):
            line = line.strip()
            if "Sessions:" in line and "Messages:" in line:
                parts = line.split()
                try: insights["sessions_30d"] = int(parts[1])
                except: pass
                try: insights["messages_30d"] = int(parts[3])
                except: pass
            elif "Tool calls:" in line:
                try: insights["tool_calls_30d"] = int(line.split()[2])
                except: pass
            elif "Input tokens:" in line:
                try: insights["input_tokens_30d"] = int(line.split()[2].replace(",", ""))
                except: pass
            elif "Output tokens:" in line:
                try: insights["output_tokens_30d"] = int(line.split()[2].replace(",", ""))
                except: pass
            elif "Total tokens:" in line:
                try: insights["total_tokens_30d"] = int(line.split()[2].replace(",", ""))
                except: pass
            elif "Active time:" in line:
                insights["active_time"] = line.split("~", 1)[-1].strip() if "~" in line else ""
        return insights
    except:
        return {}


def get_server_info():
    """Kernel, hostnaam, uptime, geheugen."""
    info = {
        "hostname": platform.node(),
        "os": f"{platform.system()} {platform.release()}",
        "python": platform.python_version(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        uptime = open("/proc/uptime").read().split()[0]
        info["uptime_days"] = round(float(uptime) / 86400, 1)
    except: pass
    try:
        mem = open("/proc/meminfo").read()
        for line in mem.split("\n"):
            if "MemTotal" in line: info["mem_total_kb"] = int(line.split()[1])
            if "MemAvailable" in line: info["mem_avail_kb"] = int(line.split()[1])
        info["mem_used_pct"] = round((1 - info.get("mem_avail_kb", 1) / info.get("mem_total_kb", 1)) * 100, 1)
    except: pass
    try:
        load = open("/proc/loadavg").read().split()
        info["load_1m"], info["load_5m"], info["load_15m"] = load[:3]
    except: pass
    try:
        r = subprocess.run(["ps", "aux"], capture_output=True, text=True, timeout=5)
        lines = r.stdout.strip().split("\n")[1:]
        info["processes"] = len(lines)
        info["python_processes"] = sum(1 for l in lines if "python" in l.lower())
    except: pass
    return info


def get_gateway_status():
    """Status van gateway services via systemctl --user."""
    statuses = {}
    profiles = [("default", "hermes-gateway.service"),
                ("webdesigner", "hermes-gateway-webdesigner.service")]
    for name, unit in profiles:
        try:
            r = subprocess.run(["systemctl", "--user", "is-active", unit],
                               capture_output=True, text=True, timeout=5)
            statuses[name] = r.stdout.strip()
        except:
            statuses[name] = "unknown"
    return statuses


def get_preferences():
    """Lees opgeslagen voorkeuren."""
    if PREF_PATH.exists():
        try: return json.loads(open(PREF_PATH).read())
        except: return {}
    return {"theme": "dark", "language": "nl", "refresh_interval": 15,
            "show_cost": True, "accent_color": "#22c55e"}


def get_hermes_health():
    """Health check van de Hermes API server op :8642."""
    try:
        r = subprocess.run(
            ["curl", "-s", "-H", "Authorization: Bearer change-me-local-dev",
             f"{API_URL}/health"],
            capture_output=True, text=True, timeout=5
        )
        if r.returncode == 0 and r.stdout:
            return json.loads(r.stdout)
        return {"status": "unreachable"}
    except:
        return {"status": "unreachable"}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DASHBOARD), **kwargs)

    def _send_json(self, data, status=200):
        body = json.dumps(data, indent=2, default=str).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/data":
            print(f"  [data] live collectie gestart...", flush=True)
            data = {
                "collected_at": datetime.now(timezone.utc).isoformat(),
                "version": "2.0.0",
                "mode": "real-time",
                "sessions": get_session_stats(),
                "providers": get_provider_config(),
                "auth": get_auth_status(),
                "logs": get_log_summary(),
                "insights": get_insights(),
                "server": get_server_info(),
                "gateway": get_gateway_status(),
                "preferences": get_preferences(),
                "hermes_api": get_hermes_health(),
            }
            print(f"  [data] sessies={data['sessions'].get('sessions','?')} "
                  f"berichten={data['sessions'].get('messages','?')} "
                  f"providers={len(data['providers'])} "
                  f"keys={len(data['auth'].get('credentials',[]))}", flush=True)
            self._send_json(data)
        elif self.path == "/api/refresh":
            # Bestaat niet meer — v0.5 gebruikt real-time data
            self._send_json({"ok": False, "error": "v0.5 gebruikt real-time API, geen refresh nodig"}, status=410)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/preferences":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode() if length else "{}"
            try:
                prefs = json.loads(body)
                PREF_PATH.parent.mkdir(parents=True, exist_ok=True)
                with open(PREF_PATH, "w") as f:
                    json.dump(prefs, f, indent=2)
                self._send_json({"ok": True})
            except Exception as e:
                self._send_json({"error": str(e)}, status=400)
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, fmt, *args):
        print(f"  [http] {args[0]} {args[1]} {args[2]}", flush=True)


if __name__ == "__main__":
    print(f"🚀 Hermes Dashboard Server v0.5 — real-time data API")
    print(f"   http://localhost:{PORT}/")
    print(f"   http://localhost:{PORT}/api/data  (live data)")
    print(f"   http://localhost:{PORT}/api/preferences  (POST config)")
    print(f"   Geen cron, geen data collector, geen data.json")
    print(f"   Data rechtstreeks uit Hermes state.db + CLI")
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
