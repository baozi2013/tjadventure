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
rsync -av --delete /Users/tianhengzhou/Documents/tjadventure/ tianheng@192.168.68.88:/home/tianheng/tjadventure/
```

### 2) Build and run on NAS

```bash
ssh tianheng@192.168.68.88
cd /home/tianheng/tjadventure
docker compose -f docker-compose.nas.yml up -d --build
docker ps | grep tjadventure-web
```

### 3) Open site in LAN

```text
http://192.168.68.88:3000
```

### Optional: update deployment after content change

```bash
rsync -av --delete /Users/tianhengzhou/Documents/tjadventure/ tianheng@192.168.68.88:/home/tianheng/tjadventure/
ssh tianheng@192.168.68.88 "cd /home/tianheng/tjadventure && docker compose -f docker-compose.nas.yml up -d --build"
```
