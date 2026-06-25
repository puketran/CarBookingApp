#!/usr/bin/env bash
# Run the CarBooking server (:3000) and client (:5173) together.
# Usage: ./dev.sh   (Ctrl+C stops both)

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Installing deps (skips if already installed)…"
[ -d "$ROOT/server/node_modules" ] || (cd "$ROOT/server" && npm install)
[ -d "$ROOT/client/node_modules" ] || (cd "$ROOT/client" && npm install)

# Kill both child processes when this script exits / Ctrl+C.
cleanup() {
  echo "\n==> Shutting down…"
  kill 0 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "==> Starting server on http://localhost:3000"
(cd "$ROOT/server" && npm run dev) &

echo "==> Starting client on http://localhost:5173"
(cd "$ROOT/client" && npm run dev) &

wait
