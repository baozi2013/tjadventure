---
name: trello-board
description: Use when the user asks to inspect, triage, update, or complete Trello board cards, especially the TJ Adventure Travel Blog PM board. Load Trello API credentials from the user-level file ~/.openclaw/.env and never store or print the key/token.
---

# Trello Board

Use this skill for Trello board work.

## Credentials

- Credentials live in `~/.openclaw/.env`.
- Expected variables: `TRELLO_API_KEY` and `TRELLO_TOKEN`.
- Do not print, copy, commit, or summarize secret values.
- Ensure the env file is user-only readable (`chmod 600 ~/.openclaw/.env`) before using it.
- For shell commands, load credentials with:

```bash
set -a
source ~/.openclaw/.env
set +a
```

## TJ Adventure Board

- Board URL: `https://trello.com/b/AcmeDrWP/tj-adventure-travel-blog-pm`
- Board shortlink: `AcmeDrWP`
- Common lists: `Sprint 1 - In Progress`, `Sprint 1 - Next`, `Sprint 2 Queue`, `Backlog - P1`, `Icebox - P2`, `Done`.

## API Helper

Prefer the bundled helper for Trello REST calls:

```bash
.claude/skills/trello-board/scripts/trello-api.sh GET /boards/AcmeDrWP/lists --data-urlencode cards=open
```

Examples:

```bash
# List open cards on the TJ Adventure board.
.claude/skills/trello-board/scripts/trello-api.sh GET /boards/AcmeDrWP/cards/open

# Get lists and cards.
.claude/skills/trello-board/scripts/trello-api.sh GET /boards/AcmeDrWP/lists --data-urlencode cards=open

# Move a card to a list.
.claude/skills/trello-board/scripts/trello-api.sh PUT /cards/<card-id> --data-urlencode idList=<list-id>
```

## Workflow

1. Read the board/list/card state via API when possible; use a browser only when login-only UI details are needed.
2. Prefer actionable cards in active sprint/queue lists over Icebox.
3. Do the implementation and verification first.
4. After commit, push, and deployment succeed, update the Trello card:
   - mark relevant checklist items complete when present,
   - move the card to `Done`,
   - add a concise comment with commit/deploy result if useful.
5. Never move a card to `Done` before the work is actually deployed.
6. Moving cards, adding comments, and any other write to a shared Trello board is visible to other collaborators — confirm with the user before making board changes unless they've explicitly asked for hands-off automation.
