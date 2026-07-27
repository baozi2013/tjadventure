#!/usr/bin/env bash
set -euo pipefail

# Push current branch to remote, then deploy on NAS:
# 1) ssh tianheng@192.168.68.88
# 2) cd ~/projects/tjadventure
# 3) git pull && docker compose -f docker-compose.nas.yml up -d --build

REPO_DIR="${REPO_DIR:-.}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
BRANCH="${BRANCH:-}"
NAS_HOST="${NAS_HOST:-tianheng@192.168.68.88}"
NAS_DIR="${NAS_DIR:-~/projects/tjadventure}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.nas.yml}"
ALLOW_DIRTY=0
SKIP_PUSH=0
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage: push_and_deploy_nas.sh [options]

Default flow:
1) git push <remote> <branch>
2) ssh <nas_host>
3) cd <nas_dir>
4) git pull && docker compose -f <compose_file> up -d --build

Options:
  --repo-dir <path>       Git repo path (default: current dir)
  --remote <name>         Git remote (default: origin)
  --branch <name>         Branch to push (default: current branch)
  --nas-host <user@host>  NAS SSH target (default: tianheng@192.168.68.88)
  --nas-dir <path>        NAS repo path (default: ~/projects/tjadventure)
  --compose-file <file>   Compose file on NAS (default: docker-compose.nas.yml)
  --skip-push             Skip local git push
  --allow-dirty           Allow uncommitted local changes
  --dry-run               Print commands without executing
  -h, --help              Show help

Environment variables are also supported:
  REPO_DIR, GIT_REMOTE, BRANCH, NAS_HOST, NAS_DIR, COMPOSE_FILE
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-dir)
      REPO_DIR="$2"
      shift 2
      ;;
    --remote)
      GIT_REMOTE="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --nas-host)
      NAS_HOST="$2"
      shift 2
      ;;
    --nas-dir)
      NAS_DIR="$2"
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
      shift
      ;;
    --skip-push)
      SKIP_PUSH=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
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

run_cmd() {
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    echo "[dry-run] $*"
    return 0
  fi
  "$@"
}

cd "${REPO_DIR}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository: ${REPO_DIR}" >&2
  exit 1
fi

if [[ -z "${BRANCH}" ]]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

if [[ "${ALLOW_DIRTY}" -eq 0 ]] && [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit/stash changes or use --allow-dirty." >&2
  exit 1
fi

echo "Repo     : $(pwd)"
echo "Branch   : ${BRANCH}"
echo "Remote   : ${GIT_REMOTE}"
echo "NAS Host : ${NAS_HOST}"
echo "NAS Dir  : ${NAS_DIR}"
echo "Compose  : ${COMPOSE_FILE}"

if [[ "${SKIP_PUSH}" -eq 0 ]]; then
  run_cmd git push "${GIT_REMOTE}" "${BRANCH}"
else
  echo "Skip git push (--skip-push)."
fi

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "[dry-run] ssh ${NAS_HOST} \"cd ${NAS_DIR} && git pull && docker compose -f ${COMPOSE_FILE} up -d --build\""
  exit 0
fi

ssh "${NAS_HOST}" "bash -s -- '${NAS_DIR}' '${COMPOSE_FILE}'" <<'REMOTE'
set -euo pipefail

NAS_DIR_RAW="$1"
COMPOSE_FILE="$2"

case "${NAS_DIR_RAW}" in
  "~"/*)
    NAS_DIR="${HOME}/${NAS_DIR_RAW#\~/}"
    ;;
  "\$HOME"/*)
    NAS_DIR="${HOME}/${NAS_DIR_RAW#\$HOME/}"
    ;;
  *)
    NAS_DIR="${NAS_DIR_RAW}"
    ;;
esac

cd "${NAS_DIR}"
git pull
docker compose -f "${COMPOSE_FILE}" up -d --build
REMOTE

echo "NAS deploy finished."
