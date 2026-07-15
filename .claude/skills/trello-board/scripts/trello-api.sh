#!/usr/bin/env bash
set -euo pipefail

env_file="${TRELLO_ENV_FILE:-$HOME/.openclaw/.env}"
if [[ ! -f "$env_file" ]]; then
  echo "Missing Trello env file: $env_file" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$env_file"
set +a

: "${TRELLO_API_KEY:?Missing TRELLO_API_KEY in $env_file}"
: "${TRELLO_TOKEN:?Missing TRELLO_TOKEN in $env_file}"

method="${1:-}"
endpoint="${2:-}"
if [[ -z "$method" || -z "$endpoint" ]]; then
  echo "Usage: $0 METHOD /1-endpoint [curl args...]" >&2
  exit 2
fi
shift 2

curl --fail --silent --show-error \
  --request "$method" \
  --get "https://api.trello.com/1${endpoint}" \
  --data-urlencode "key=${TRELLO_API_KEY}" \
  --data-urlencode "token=${TRELLO_TOKEN}" \
  "$@"
