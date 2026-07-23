#!/bin/sh
set -eu

CONFIG_FILE=/usr/share/nginx/html/config.js

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$CONFIG_FILE" <<EOF
window.__KINTI_CONFIG__ = {
  VITE_API_URL: "$(escape_js "${VITE_API_URL:-}")",
  VITE_SUPABASE_URL: "$(escape_js "${VITE_SUPABASE_URL:-}")",
  VITE_SUPABASE_ANON_KEY: "$(escape_js "${VITE_SUPABASE_ANON_KEY:-}")"
};
EOF
