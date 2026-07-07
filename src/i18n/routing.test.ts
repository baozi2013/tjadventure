import { describe, expect, it } from "vitest";
import { getLocalizedHref, getLocalizedPathname, isSupportedLocale, stripLocalePrefix } from "@/i18n/routing";

describe("isSupportedLocale", () => {
  it("accepts known locales", () => {
    expect(isSupportedLocale("zh-CN")).toBe(true);
    expect(isSupportedLocale("en-US")).toBe(true);
  });

  it("rejects unknown locales", () => {
    expect(isSupportedLocale("fr-FR")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
  });
});

describe("stripLocalePrefix", () => {
  it("strips the /en prefix", () => {
    expect(stripLocalePrefix("/en/trips")).toBe("/trips");
  });

  it("collapses bare /en to root", () => {
    expect(stripLocalePrefix("/en")).toBe("/");
  });

  it("strips a bare /zh-CN prefix to root", () => {
    expect(stripLocalePrefix("/zh-CN")).toBe("/");
  });

  it("strips a /zh-CN/ prefix", () => {
    expect(stripLocalePrefix("/zh-CN/trips")).toBe("/trips");
  });

  it("leaves unprefixed paths untouched", () => {
    expect(stripLocalePrefix("/trips")).toBe("/trips");
  });

  it("does not strip a path that merely starts with the same letters", () => {
    expect(stripLocalePrefix("/english-guide")).toBe("/english-guide");
  });

  it("defaults empty input to root", () => {
    expect(stripLocalePrefix("")).toBe("/");
  });
});

describe("getLocalizedPathname", () => {
  it("leaves zh-CN (default locale) unprefixed", () => {
    expect(getLocalizedPathname("/trips", "zh-CN")).toBe("/trips");
  });

  it("prefixes en-US with /en", () => {
    expect(getLocalizedPathname("/trips", "en-US")).toBe("/en/trips");
  });

  it("maps root to /en for en-US", () => {
    expect(getLocalizedPathname("/", "en-US")).toBe("/en");
  });

  it("re-localizes a path that already has a different locale prefix", () => {
    expect(getLocalizedPathname("/en/trips", "zh-CN")).toBe("/trips");
    expect(getLocalizedPathname("/zh-CN/trips", "en-US")).toBe("/en/trips");
  });
});

describe("getLocalizedHref", () => {
  it("localizes an internal path", () => {
    expect(getLocalizedHref("/trips", "en-US")).toBe("/en/trips");
  });

  it("passes through external links unchanged", () => {
    expect(getLocalizedHref("https://example.com/x", "en-US")).toBe("https://example.com/x");
  });

  it("passes through hash-only links unchanged", () => {
    expect(getLocalizedHref("#section", "en-US")).toBe("#section");
  });

  it("passes through mailto/tel links unchanged", () => {
    expect(getLocalizedHref("mailto:a@b.com", "en-US")).toBe("mailto:a@b.com");
    expect(getLocalizedHref("tel:+15551234567", "en-US")).toBe("tel:+15551234567");
  });

  it("preserves query string and hash while localizing the path", () => {
    expect(getLocalizedHref("/search?q=tahoe#results", "en-US")).toBe("/en/search?q=tahoe#results");
  });
});
