# NAS Deploy Notes

Preferred deploy path after post updates:

1. Push branch to git remote.
2. SSH to NAS.
3. `cd ~/projects/tjadventure`
4. `git pull`
5. `docker compose -f docker-compose.nas.yml up -d --build`

Skill helper script:

- `scripts/push_and_deploy_nas.sh`

Defaults:

- NAS host: `tianheng@192.168.68.88`
- NAS repo dir: `~/projects/tjadventure`
- Compose file: `docker-compose.nas.yml`

Safety:

- Script fails on dirty working tree unless `--allow-dirty` is set.
- Use `--dry-run` first when needed.
