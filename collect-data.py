#!/usr/bin/env python3
"""Hermes Dashboard Data Collector — verzamelt live data uit Hermes omgeving."""
import json, os, sqlite3, yaml
from datetime import datetime, timezone
from pathlib import Path

HERMES_HOME = Path.home() / ".hermes"
OUTPUT = HERMES_HOME / "hermes-dashboard" / "data.json"
DB_PATH = HERMES_HOME / "state.db"
CONFIG_PATH = HERMES_HOME / "config.yaml"
AUTH_PATH = HERMES_HOME / "auth.json"
ENV_PATH = HERMES_HOME / ".env"
LOG_DIR = HERMES_HOME / "logs"

def safe_read_json(path):
    try: return json.loads(open(path).read())
    except: return {}

def safe_read_yaml(path):
    try: return yaml.safe_load(open(path).read())
    except: return {}

def get_session_stats():
    """Aantallen uit de state.db — met token/kosten data."""
    db = DB_PATH
    if not db.exists(): return {"sessions": 0, "messages": 0}
    try:
        con = sqlite3.connect(str(db))
        con.row_factory = sqlite3.Row
        cur = con.cursor()

        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {r[0] for r in cur.fetchall()}

        data = {"db_size_mb": round(db.stat().st_size / 1048576, 1)}
        has_sessions = "sessions" in tables
        has_messages = "messages" in tables

        if has_sessions:
            # Totaal tellingen
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

            # Per source
            for src in ["telegram", "cli", "cron", "tui"]:
                cur.execute("SELECT COUNT(*) FROM sessions WHERE source=?", (src,))
                data[f"{src}_sessions"] = cur.fetchone()[0]

            # Laatste sessie
            cur.execute("SELECT id, started_at, source, title FROM sessions "
                        "ORDER BY started_at DESC LIMIT 1")
            row = cur.fetchone()
            if row:
                data["last_session"] = {"id": row["id"], "source": row["source"],
                                         "title": row["title"],
                                         "at": row["started_at"]}

            # Per model verbruik
            cur.execute("SELECT model, COUNT(*) as cnt, "
                        "COALESCE(SUM(input_tokens+output_tokens),0) as tokens, "
                        "COALESCE(SUM(estimated_cost_usd),0) as cost "
                        "FROM sessions WHERE model IS NOT NULL AND model != '' "
                        "GROUP BY model ORDER BY tokens DESC")
            data["models"] = [dict(r) for r in cur.fetchall()]

            # Vandaag stats
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
    if not cfg: return {}

    providers = {}
    # Hoofdmodel
    model = cfg.get("model", {})
    providers["primary"] = {
        "name": model.get("default", "?"),
        "provider": model.get("provider", "?"),
        "base_url": model.get("base_url", "") or "(default)"
    }

    # Custom providers (Jetson etc.)
    for name, p in cfg.get("providers", {}).items():
        providers[name] = {
            "models": list(p.get("models", {}).keys()) if isinstance(p.get("models"), dict) else [],
            "base_url": p.get("base_url", "?")[:60]
        }

    # Fallback
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

    # .env keys detectie
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
    log_dir = LOG_DIR
    if not log_dir.exists(): return {}
    try:
        agent_log = log_dir / "agent.log"
        error_log = log_dir / "errors.log"
        gateway_log = log_dir / "gateway.log"

        errors = 0
        warnings = 0
        quotas = 0

        for logfile in [agent_log, error_log, gateway_log]:
            if logfile.exists():
                content = open(logfile, errors='ignore').read()
                errors += content.count(" ERROR ")
                warnings += content.count(" WARNING ")
                quotas += content.count("429") + content.count("quota")

        # Log sizes
        sizes = {}
        for f in log_dir.iterdir():
            if f.is_file():
                sizes[f.name] = round(f.stat().st_size / 1024, 1)

        return {
            "errors": errors,
            "warnings": warnings,
            "quota_hits": quotas,
            "log_sizes_kb": sizes
        }
    except:
        return {}

def get_insights():
    """Data uit hermes insights via CLI."""
    import subprocess
    try:
        result = subprocess.run(
            ["hermes", "insights", "--days", "30"],
            capture_output=True, text=True, timeout=15,
            env={**os.environ, "HERMES_HOME": str(HERMES_HOME)}
        )
        output = result.stdout
        # Parse key metrics
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
    import platform, subprocess
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
        python_procs = sum(1 for l in lines if "python" in l.lower())
        info["python_processes"] = python_procs
    except: pass
    return info

def get_gateway_status():
    """Status van gateway services (default + webdesigner)."""
    import subprocess
    statuses = {}
    for profile in ["default", "webdesigner"]:
        try:
            if profile == "default":
                r = subprocess.run(["systemctl", "--user", "is-active", "hermes-gateway.service"],
                                   capture_output=True, text=True, timeout=5)
            else:
                r = subprocess.run(["systemctl", "--user", "is-active", f"hermes-gateway-{profile}.service"],
                                   capture_output=True, text=True, timeout=5)
            statuses[profile] = r.stdout.strip()
        except:
            statuses[profile] = "unknown"
    return statuses

def get_preferences():
    """Lees opgeslagen voorkeuren."""
    pref_path = HERMES_HOME / "hermes-dashboard" / "preferences.json"
    if pref_path.exists():
        try: return json.loads(open(pref_path).read())
        except: return {}
    return {
        "theme": "dark",
        "language": "nl",
        "refresh_interval": 15,
        "show_cost": True,
        "accent_color": "#22c55e"
    }

def main():
    print(f"🔍 Hermes Data Collector — {datetime.now().isoformat()}")

    data = {
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "sessions": get_session_stats(),
        "providers": get_provider_config(),
        "auth": get_auth_status(),
        "logs": get_log_summary(),
        "insights": get_insights(),
        "server": get_server_info(),
        "gateway": get_gateway_status(),
        "preferences": get_preferences()
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(data, f, indent=2, default=str)

    size_kb = round(OUTPUT.stat().st_size / 1024, 1)
    print(f"✅ Data geschreven naar {OUTPUT} ({size_kb} KB)")
    print(f"   Sessies: {data['sessions'].get('sessions', '?')}")
    print(f"   Berichten: {data['sessions'].get('messages', '?')}")
    print(f"   Providers: {len(data['providers'])}")
    print(f"   API keys: {len(data['auth'].get('credentials', []))}")

if __name__ == "__main__":
    main()
