# TJ Adventure

TJ Adventure is a bilingual family travel journal built with Next.js. It publishes reusable trip stories, map-based route notes, cycling entries, full-site search, RSS, sitemap, and Docker/NAS deployment support.

## Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Useful checks:

```bash
npm run validate:posts
npm run audit:images
npm run check:images
npm run lint
npm run build
```

## Image Asset Workflow

Travel and cycling content should reference web-ready local images. The build
enforces a `5 MB` budget for images referenced from content frontmatter or MDX.

Audit referenced images:

```bash
npm run audit:images
```

Fail when referenced images exceed the budget:

```bash
npm run check:images
```

Generate optimized WebP derivatives for over-budget referenced images and update
content references to `/optimized/...` paths:

```bash
npm run optimize:images -- --write --replace-references
```

The optimizer keeps original files in `public/trips`; it only writes derivatives
under `public/optimized` and rewrites content references. Use
`npm run optimize:images -- --limit 5` for a dry run against the largest five
referenced assets before writing.

## Project Structure

- `src/app`: App Router routes, metadata routes, RSS, sitemap, and robots.
- `src/components`: Shared UI for navigation, cards, maps, MDX rendering, Strava embeds, and search.
- `src/lib`: Content parsing, validation helpers, cycling helpers, and SEO metadata utilities.
- `docs`: Architecture notes and implementation decision records, including the i18n evaluation.
- `content/posts`: Travel story MDX files.
- `content/cycling`: Cycling entry MDX files.
- `content/learning`: Godot learning journal MDX files.
- `public`: Local image and branding assets.
- `scripts`: Content validation, Strava draft import, and NAS deployment scripts.

## Architecture Notes

- [F1 i18n evaluation](docs/i18n-evaluation.md): recommended multilingual routing, content, SEO, search, and rollout plan.

## Content Models

### Travel posts

Travel stories live in `content/posts/*.mdx`. Use `content/posts/_template.mdx` for the required frontmatter shape.

### Cycling entries

Cycling rides live in `content/cycling/*.mdx` as a separate collection from travel posts. Use `content/cycling/_template.mdx` for the required schema:

- `rideType`: `road`, `event`, or `gravel`
- `rideDate`: `YYYY-MM-DD`
- `distance`: `{ value, unit }` with `mi` or `km`
- `elevationGain`: `{ value, unit }` with `ft` or `m`
- `movingTime`: `HHH:MM:SS`, for example `5:12:30`
- `location`: `{ name, region }`, with optional `lat`, `lng`, and `note`
- `route.track`: optional GeoJSON route overlay, for example `{ src: "/tracks/lake-tahoe-2024.geojson", format: "geojson" }`
- `stravaUrl`: a Strava activity URL
- `coverImage` and optional `images`: local `/public` assets or http(s) URLs

Run `npm run validate:posts` before publishing content. It validates both travel posts and cycling entries.

### Learning journal entries

The Godot learning journey lives in `content/learning/*.mdx` (with `content/en/learning/*.mdx` for English) as its own collection, separate from travel posts and cycling entries. Use `content/learning/_template.mdx` for the required frontmatter shape:

- `title`, `excerpt`, `date` (`YYYY-MM-DD`)
- `locale`, `translationKey`, optional `canonicalLocale` (same rules as travel posts)
- `coverImage`: optional local `/public` asset or http(s) URL; falls back to `/learning/cover-placeholder.jpg` when omitted
- `tags`: optional array of strings

Entries appear at `/learning`, and are included in the site search index, sitemap, and RSS feed. Run `npm run validate:posts` before publishing; it validates learning entries alongside travel posts and cycling entries.

### Import a Strava ride draft

Generate a reviewable Cycling draft from a public Strava activity URL:

```bash
npm run import:strava-cycling -- https://www.strava.com/activities/11881460715
```

The importer writes to `content/cycling/_drafts/<suggested-slug>.mdx`, which is not included in the public collection. For a nearly publishable draft, add confirmed details at import time:

```bash
npm run import:strava-cycling -- https://www.strava.com/activities/11881460715 \
  --slug lake-tahoe-ride \
  --ride-type road \
  --location "Lake Tahoe" \
  --region "US - California" \
  --cover-image "/trips/lake-tahoe-2024/day1-2.jpg"
```

For a public activity, the script extracts the title, date, public image hint, and available embed stats. If an activity is private or returns incomplete metadata, the script still creates a draft with `TODO` values: fill those fields from the Strava activity, choose local images, and keep `stravaUrl` as the source reference. If Strava provides an embed token for an activity, pass it with `--embed-token <token>` to seed the embedded activity block.

Use `--stdout` to preview generated MDX without writing a draft.

### Sync Strava rides through OAuth

For authorized Strava data, keep credentials outside the repository. The scripts
load `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` from `~/.openclaw/.env` and
store OAuth tokens in `~/.openclaw/strava-token.json` by default.

```bash
npm run strava:oauth -- auth-url
npm run strava:oauth -- exchange --code <code-from-redirect-url>
npm run strava:oauth -- status
```

After the token is stored, sync authorized ride metadata into the unpublished
draft checkpoint:

```bash
npm run sync:strava-cycling -- --after 2026-01-01 --limit 10
```

By default the OAuth sync only considers longer rides at or above `50 mi`, so
short lunch rides, indoor rides, and quick errands do not become drafts. Adjust
the threshold when needed:

```bash
npm run sync:strava-cycling -- --after 2026-01-01 --limit 10 --min-distance-mi 60
```

To sync one activity:

```bash
npm run sync:strava-cycling -- --activity-id 1234567890 --ride-type road
```

The sync command writes to `content/cycling/_drafts/`, which is ignored by the
public collection. Review title, stats, route, privacy, and images before moving
any draft into `content/cycling/`.

Run the review checkpoint before publishing a synced draft:

```bash
npm run review:strava-cycling --
npm run review:strava-cycling -- --slug test-gravel-loop-2026 --strict
```

The review command checks for unresolved `TODO` markers, missing local assets,
duplicate Strava activity URLs, and draft readiness. It reports status only; it
does not move or publish files.

## Deploy on NAS (Docker)

This repo includes:

- `Dockerfile` (multi-stage build, Next.js standalone output)
- `docker-compose.nas.yml`

### 1) Copy code to NAS

From your Mac:

```bash
rsync -av --delete /path_to_folder user_name@xxx.xx.xx.xx:~/tjadventure/
```

### 2) Build and run on NAS

```bash
ssh user_name@xxx.xx.xx.xx
cd ~/tjadventure
SITE_URL='http://xxx.xx.xx.xx:3000' docker compose -f docker-compose.nas.yml up -d --build
docker ps | grep tjadventure-web
```

### 3) Open site in LAN

```text
http://xxx.xx.xx.xx:3000
```

### One-command deploy script (from Mac)

```bash
chmod +x scripts/deploy-nas.sh
./scripts/deploy-nas.sh
```

With SSH tunnel (open local `http://localhost:13000`):

```bash
./scripts/deploy-nas.sh --tunnel
```

If your NAS repo is not default path:

```bash
REMOTE_DIR='~/projects/tjadventure' ./scripts/deploy-nas.sh
```

To publish canonical and sitemap URLs under a public domain instead of the default NAS address:

```bash
SITE_URL='https://travel.example.com' ./scripts/deploy-nas.sh
```

### Optional: update deployment after content change

```bash
rsync -av --delete /path_to_folder user_name@xxx.xx.xx.xx:~/tjadventure/
ssh user_name@xxx.xx.xx.xx "cd ~/tjadventure && SITE_URL='http://xxx.xx.xx.xx:3000' docker compose -f docker-compose.nas.yml up -d --build"
```
