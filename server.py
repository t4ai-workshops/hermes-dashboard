#!/usr/bin/env python3
"""Hermes Dashboard Server — serveert statische bestanden + API voor config."""
import json, os, sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

DASHBOARD = Path.home() / ".hermes" / "hermes-dashboard"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DASHBOARD), **kwargs)

    def do_POST(self):
        if self.path == "/api/preferences":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode() if length else "{}"
            try:
                prefs = json.loads(body)
                with open(DASHBOARD / "preferences.json", "w") as f:
                    json.dump(prefs, f, indent=2)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode())
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        elif self.path == "/api/refresh":
            # Trigger data collector
            import subprocess
            try:
                r = subprocess.run([sys.executable, str(DASHBOARD / "collect-data.py")],
                                   capture_output=True, text=True, timeout=30)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "output": r.stdout}).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

if __name__ == "__main__":
    print(f"🚀 Hermes Dashboard Server op http://localhost:{PORT}")
    print(f"   Open: http://localhost:{PORT}/index.html")
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
