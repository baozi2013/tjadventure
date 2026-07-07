#!/usr/bin/env bash
set -euo pipefail

NAS_USER="${NAS_USER:-}"
NAS_HOST="${NAS_HOST:-}"
NAS_PORT="${NAS_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-~/projects/tjadventure}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.nas.yml}"
BRANCH="${BRANCH:-main}"

OPEN_TUNNEL=0
LOCAL_PORT="${LOCAL_PORT:-13000}"
REMOTE_APP_PORT="${REMOTE_APP_PORT:-3000}"

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy-nas.sh [options]

Deploy flow (on NAS):
1) git fetch/checkout/pull
2) docker compose up -d --build

Options:
  -b, --branch <name>     Git branch to deploy (default: main)
  -t, --tunnel            Open local SSH tunnel after deploy
  --local-port <port>     Local port for tunnel (default: 13000)
  --remote-port <port>    NAS app port (default: 3000)
  -h, --help              Show this help

Required environment variables (no defaults):
  NAS_USER, NAS_HOST

Optional environment overrides:
  NAS_PORT, REMOTE_DIR, COMPOSE_FILE, BRANCH, SITE_URL
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--branch)
      BRANCH="$2"
      shift 2
      ;;
    -t|--tunnel)
      OPEN_TUNNEL=1
      shift
      ;;
    --local-port)
      LOCAL_PORT="$2"
      shift 2
      ;;
    --remote-port)
      REMOTE_APP_PORT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "${NAS_USER}" || -z "${NAS_HOST}" ]]; then
  echo "NAS_USER and NAS_HOST must be set (no defaults are baked in). Example:" >&2
  echo "  NAS_USER=youruser NAS_HOST=your.nas.host ./scripts/deploy-nas.sh" >&2
  echo "Or export them in your shell profile / a local untracked .env file first." >&2
  exit 1
fi

SITE_URL="${SITE_URL:-http://${NAS_HOST}:${REMOTE_APP_PORT}}"

echo "Deploying to ${NAS_USER}@${NAS_HOST}:${REMOTE_DIR} (branch: ${BRANCH}, site URL: ${SITE_URL})..."

ssh -p "${NAS_PORT}" "${NAS_USER}@${NAS_HOST}" "bash -s -- '${REMOTE_DIR}' '${BRANCH}' '${COMPOSE_FILE}' '${SITE_URL}'" <<'REMOTE_SCRIPT'
set -euo pipefail

REMOTE_DIR_RAW="${1}"
BRANCH="${2}"
COMPOSE_FILE="${3}"
SITE_URL="${4}"

case "${REMOTE_DIR_RAW}" in
  "~/"*)
    REMOTE_DIR="${HOME}/${REMOTE_DIR_RAW#"~/"}"
    ;;
  \$HOME/*)
    REMOTE_DIR="${HOME}/${REMOTE_DIR_RAW#\$HOME/}"
    ;;
  *)
    REMOTE_DIR="${REMOTE_DIR_RAW}"
    ;;
esac

cd "${REMOTE_DIR}"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"
export SITE_URL

if docker compose version >/dev/null 2>&1; then
  COMPOSE_BIN="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_BIN="docker-compose"
else
  echo "Neither 'docker compose' nor 'docker-compose' is available on NAS." >&2
  exit 1
fi

# shellcheck disable=SC2086
${COMPOSE_BIN} -f "${COMPOSE_FILE}" up -d --build
docker ps --filter "name=tjadventure-web" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
REMOTE_SCRIPT

echo "Deploy complete: ${SITE_URL}"

if [[ "${OPEN_TUNNEL}" -eq 1 ]]; then
  if lsof -iTCP:"${LOCAL_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port ${LOCAL_PORT} is already in use locally. Skip tunnel." >&2
    exit 1
  fi

  echo "Opening SSH tunnel: localhost:${LOCAL_PORT} -> ${NAS_HOST}:${REMOTE_APP_PORT}"
  ssh -fN -p "${NAS_PORT}" -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_APP_PORT}" "${NAS_USER}@${NAS_HOST}"
  echo "Tunnel ready: http://localhost:${LOCAL_PORT}"
fi
