#!/usr/bin/env sh
set -eu

ASSETS_DIR="/usr/share/nginx/html/assets"
TEMPLATE="$ASSETS_DIR/config.template.json"
OUT="$ASSETS_DIR/config.json"

# Defaults (override via env)
: "${SF_API_VERSION:=60.0}"
: "${SF_REDIRECT_URI:=http://localhost:4200}"

if [ -f "$TEMPLATE" ]; then
  # Replace ${VARS} in template with env values
  envsubst < "$TEMPLATE" > "$OUT"
fi

exec nginx -g "daemon off;"

