This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

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
- `stravaUrl`: a Strava activity URL
- `coverImage` and optional `images`: local `/public` assets or http(s) URLs

Run `npm run validate:posts` before publishing content. It validates both travel posts and cycling entries.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on NAS (Docker)

This repo now includes:

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
docker compose -f docker-compose.nas.yml up -d --build
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

### Optional: update deployment after content change

```bash
rsync -av --delete /path_to_folder user_name@xxx.xx.xx.xx:~/tjadventure/
ssh user_name@xxx.xx.xx.xx "cd ~/tjadventure && docker compose -f docker-compose.nas.yml up -d --build"
```
