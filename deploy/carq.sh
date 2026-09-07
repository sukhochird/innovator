#!/usr/bin/env bash
# Always pass production env. Usage: ./deploy/carq.sh ps
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${ROOT}/deploy/.env.production"
COMPOSE_FILE="${ROOT}/docker-compose.prod.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy from deploy/.env.production.example and edit secrets." >&2
  exit 1
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
