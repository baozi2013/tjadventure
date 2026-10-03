import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // "standalone" is only for the self-hosted Docker/NAS build (see Dockerfile).
  // Vercel does its own serverless bundling and its build fails tracing
  // .next/next-server.js.nft.json when this is set, so skip it there.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  // map-pins.ts reads public/tracks/*.geojson via a dynamically-built fs
  // path (to derive a ride's pin location from its track when frontmatter
  // has no explicit lat/lng). Next's file tracer can't statically resolve
  // that path, so without this it conservatively bundles all of public/
  // (hundreds of MB of trip photos) into the /map function, blowing past
  // Vercel's per-function size limit. public/ is always served by Vercel's
  // static CDN regardless, so no function ever actually needs it bundled.
  outputFileTracingExcludes: {
    "**/*": ["./public/**"],
  },
  images: {
    // Vercel Hobby bills image cache writes in 8KB units per variant, so
    // serve a single format and cap widths at 1920 (the 2048/3840 defaults
    // made retina screens and crawlers fetch very large copies).
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
