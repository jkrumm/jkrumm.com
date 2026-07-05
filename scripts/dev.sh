#!/usr/bin/env bash
set -euo pipefail

PORT=7728
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")

# ── Kill stale port ──────────────────────────────────────────────
PID=$(lsof -ti :"$PORT" -sTCP:LISTEN 2>/dev/null || true)
if [ -n "$PID" ]; then
  kill "$PID" 2>/dev/null || true
  for _ in $(seq 1 30); do
    nc -z localhost "$PORT" 2>/dev/null || break
    sleep 0.2
  done
fi

# ── URLs ─────────────────────────────────────────────────────────
echo ""
echo "  ┌──────────────────────────────────────────────────────┐"
echo "  │  Local (Caddy HTTPS):                                │"
echo "  │    https://jkrumm.test                               │"
if [ "$LOCAL_IP" != "unknown" ]; then
echo "  │                                                      │"
echo "  │  Phone / other devices (same WiFi):                  │"
echo "  │    http://$LOCAL_IP:$PORT                          │"
fi
echo "  └──────────────────────────────────────────────────────┘"
echo ""

# ── Astro dev server ─────────────────────────────────────────────
exec bun --bun node_modules/.bin/astro dev --host
