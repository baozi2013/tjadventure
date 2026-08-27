import { afterEach, describe, expect, it } from "vitest";
import { createPageMetadata, getAbsoluteUrl, getMetadataBase, getSiteMetadataDefaults, getSiteUrl } from "@/lib/metadata";

const SITE_URL_KEYS = ["SITE_URL", "NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const;
const originalEnv: Record<string, string | undefined> = {};

for (const key of SITE_URL_KEYS) {
  originalEnv[key] = process.env[key];
}

afterEach(() => {
  for (const key of SITE_URL_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
});

function clearSiteUrlEnv() {
  for (const key of SITE_URL_KEYS) {
    delete process.env[key];
  }
}

describe("getSiteUrl", () => {
  it("falls back to localhost when no env var is set", () => {
    clearSiteUrlEnv();
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("adds https:// when the configured URL has no protocol", () => {
    clearSiteUrlEnv();
    process.env.SITE_URL = "tjadventure.com";
    expect(getSiteUrl()).toBe("https://tjadventure.com");
  });

  it("strips a trailing slash", () => {
    clearSiteUrlEnv();
    process.env.SITE_URL = "https://tjadventure.com/";
    expect(getSiteUrl()).toBe("https://tjadventure.com");
  });

  it("prefers SITE_URL over the Vercel-provided fallbacks", () => {
    clearSiteUrlEnv();
    process.env.SITE_URL = "https://tjadventure.com";
    process.env.VERCEL_URL = "tjadventure-git-main.vercel.app";
    expect(getSiteUrl()).toBe("https://tjadventure.com");
  });
});

describe("getAbsoluteUrl", () => {
  it("joins a pathname onto the site URL", () => {
    clearSiteUrlEnv();
    process.env.SITE_URL = "https://tjadventure.com";
    expect(getAbsoluteUrl("/posts/lake-tahoe")).toBe("https://tjadventure.com/posts/lake-tahoe");
  });

  it("adds a leading slash when the pathname is missing one", () => {
    clearSiteUrlEnv();
    process.env.SITE_URL = "https://tjadventure.com";
    expect(getAbsoluteUrl("posts/lake-tahoe")).toBe("https://tjadventure.com/posts/lake-tahoe");
  });
});

describe("getMetadataBase", () => {
  it("returns a URL instance built from the site URL", () => {
    clearSiteUrlEnv();
    process.env.SITE_URL = "https://tjadventure.com";
    expect(getMetadataBase()).toEqual(new URL("https://tjadventure.com"));
  });
});

describe("createPageMetadata", () => {
  it("sets the canonical URL and default OpenGraph/Twitter fields", () => {
    const metadata = createPageMetadata({
      title: "Lake Tahoe Weekend",
      description: "A short weekend loop around Lake Tahoe.",
      pathname: "/posts/lake-tahoe-weekend",
      locale: "en-US",
    });

    expect(metadata.alternates?.canonical).toBe("/en/posts/lake-tahoe-weekend");
    expect(metadata.openGraph?.locale).toBe("en_US");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: "Lake Tahoe Weekend" });
  });

  it("includes article-specific OpenGraph fields when provided", () => {
    const metadata = createPageMetadata({
      title: "Lake Tahoe Weekend",
      description: "A short weekend loop around Lake Tahoe.",
      pathname: "/posts/lake-tahoe-weekend",
      type: "article",
      publishedTime: "2026-03-09",
      tags: ["cycling"],
    });

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-03-09",
      tags: ["cycling"],
    });
  });
});

describe("getSiteMetadataDefaults", () => {
  it("includes locale-appropriate description and canonical alternates", () => {
    const metadata = getSiteMetadataDefaults("zh-CN");

    expect(metadata.description).toBe("家庭旅行故事、路线笔记和可以真正复用的实用攻略。");
    expect(metadata.alternates?.languages).toMatchObject({
      "zh-CN": "/",
      "en-US": "/en",
      "x-default": "/",
    });
  });
});
