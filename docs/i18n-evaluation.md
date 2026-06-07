# F1 i18n Evaluation

Date: 2026-06-07

## Decision

Adopt `next-intl` for TJ Adventure's multilingual routing, UI messages, locale-aware navigation, and SEO alternates. Keep the current Chinese site as the default locale without a URL prefix, and add English under a short prefix:

- Default locale: `zh-CN`, canonical URLs stay unprefixed, for example `/trips` and `/posts/yosemite-2024`.
- Secondary locale: `en-US`, public URLs use `/en`, for example `/en/trips` and `/en/posts/yosemite-2024`.
- Content translation remains editorial and explicit. Do not add automatic runtime translation.

Recommended routing shape:

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh-CN", "en-US"],
  defaultLocale: "zh-CN",
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      "en-US": "/en",
    },
  },
});
```

This preserves existing Chinese links while creating stable, crawlable English URLs.

## Current Project Fit

The site is a Next.js App Router project with static MDX collections:

- Routes live in `src/app`, with pages for home, about, trips, cycling, gears, search, post details, and cycling details.
- Content loaders read flat MDX files from `content/posts/*.mdx` and `content/cycling/*.mdx`.
- SEO is centralized in `src/lib/metadata.ts`, currently with `html lang="zh-CN"` and Open Graph locale `zh_CN`.
- Sitemap, RSS, and search index are generated through App Router metadata/route handlers.
- The site is deployed as a Dockerized Next.js app on NAS, so the solution should keep build-time generation predictable.

The main i18n work is therefore not string lookup alone. It also has to make routes, content discovery, search, feeds, and metadata locale-aware.

## Why `next-intl`

`next-intl` is the best fit for the current App Router codebase because it gives us:

- A shared routing config for locale prefixes, locale detection, and navigation helpers.
- App Router support through a top-level `[locale]` segment.
- `proxy.ts` integration for Next.js 16.
- Static rendering support through `generateStaticParams` and `setRequestLocale`.
- Built-in handling for alternate links when routing is configured.
- A small enough surface area for a content site that does not need a CMS yet.

Official references checked:

- Next.js App Router internationalization guide: https://nextjs.org/docs/app/guides/internationalization
- `next-intl` App Router routing setup: https://next-intl.dev/docs/routing/setup
- `next-intl` proxy/middleware behavior: https://next-intl.dev/docs/routing/middleware
- `next-intl` routing configuration: https://next-intl.dev/docs/routing/configuration
- `next-i18next` App Router notes for comparison: https://github.com/i18next/next-i18next

## Alternatives Considered

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| Next.js dictionaries only | No new dependency; easy for a tiny UI | Manual locale negotiation, navigation helpers, alternate links, and content routing | Too much custom glue for this site |
| `next-intl` | App Router-first routing setup; good SEO helpers; supports default-locale clean URLs | Requires moving pages under `[locale]` and introducing message files | Recommended |
| `next-i18next` | Strong i18next ecosystem; good if we need i18next plugins or existing namespaces | Heavier for this static content site; less aligned with the simple routing/SEO needs | Keep as fallback only |
| CMS translation workflow | Scales editorial review and translation status | Adds infrastructure and workflow cost before the site needs it | Revisit after English content volume grows |

## Target Architecture

### Routes

Move public pages under a locale segment:

```text
src/app/[locale]/layout.tsx
src/app/[locale]/page.tsx
src/app/[locale]/about/page.tsx
src/app/[locale]/trips/page.tsx
src/app/[locale]/cycling/page.tsx
src/app/[locale]/cycling/[slug]/page.tsx
src/app/[locale]/posts/[slug]/page.tsx
src/app/[locale]/search/page.tsx
```

Keep metadata endpoints deliberate:

- `src/app/sitemap.ts`: generate localized URLs and `alternates.languages`.
- `src/app/rss.xml/route.ts`: keep Chinese root feed first; add English feed only when English content exists.
- `src/app/search-index.json/route.ts`: either accept `?locale=zh-CN|en-US` or create a non-dotted localized route. The default `next-intl` matcher skips paths with dots, so dotted endpoints should not depend on proxy behavior.

### UI Messages

Add small message files:

```text
messages/zh-CN.json
messages/en-US.json
```

Start with navigation, empty states, labels, button copy, metadata defaults, search UI, and feed descriptions. Keep post bodies in MDX, not JSON.

### Content Model

Add locale fields before moving directories:

```yaml
locale: "zh-CN"
translationKey: "yosemite-2024"
canonicalLocale: "zh-CN"
```

For translated siblings:

```yaml
locale: "en-US"
translationKey: "yosemite-2024"
canonicalLocale: "zh-CN"
```

Phase 1 can keep files flat while the loader filters by `locale`. Phase 2 can migrate to locale directories if the collection grows:

```text
content/posts/zh-CN/yosemite-2024.mdx
content/posts/en-US/yosemite-2024.mdx
content/cycling/zh-CN/lake-tahoe-2024.mdx
content/cycling/en-US/lake-tahoe-2024.mdx
```

Do not require every Chinese post to have an English sibling. Missing translations should return 404 on `/en/...` unless an explicit fallback policy is chosen later.

### Metadata And SEO

Update `createPageMetadata` to accept `locale`, `pathname`, and optional translated pathnames. Generate:

- `<html lang={locale}>`
- Open Graph locale: `zh_CN` or `en_US`
- Canonical URL for the current locale
- `alternates.languages` for translated siblings only
- Sitemap alternates for pages that have more than one locale

### Search

Extend `SearchIndexEntry` with:

```ts
locale: "zh-CN" | "en-US";
translationKey?: string;
```

The search page should load and rank only the active locale by default. A later all-language toggle is optional, not part of the first migration.

### Validation

Extend `npm run validate:posts` to enforce:

- `locale` is one of the supported locales.
- `translationKey` is present and stable.
- No duplicate `(locale, slug)` or `(locale, translationKey)` collisions.
- `canonicalLocale` points to an existing sibling when provided.
- Local assets and GeoJSON checks continue to run per localized file.

## Rollout Plan

1. Install and wire `next-intl`.
2. Add `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts`, and `src/proxy.ts`.
3. Move public pages into `src/app/[locale]` and add `generateStaticParams` for `zh-CN` and `en-US`.
4. Convert `SiteNav`, page chrome, search copy, metadata defaults, and empty states to messages.
5. Add optional `locale` and `translationKey` parsing to post and cycling loaders, defaulting existing content to `zh-CN`.
6. Make sitemap, RSS, and search index locale-aware.
7. Add the first one or two English translations as acceptance fixtures.
8. Run `npm run validate:posts`, `npm run lint`, `npm run build`, then deploy.

## First Implementation Slice

The next development card should stop after these deliverables:

- `next-intl` installed and configured.
- Pages moved under `[locale]` with Chinese routes still working unprefixed.
- English shell route `/en` renders with translated navigation and metadata.
- Existing MDX content still publishes as `zh-CN`.
- Search, sitemap, and RSS continue to work for the Chinese site.

This gives us a reversible foundation before translating the full archive.

## Risks

| Risk | Mitigation |
| --- | --- |
| Existing URLs accidentally gain `/zh-CN` prefixes | Use `localePrefix: { mode: "as-needed" }` and verify unprefixed routes in browser and sitemap |
| Static generation becomes dynamic | Add `generateStaticParams` and `setRequestLocale` where `next-intl` messages are used in Server Components |
| Search index mixes languages | Add `locale` to every search entry and filter by active locale |
| RSS/search dotted routes skip proxy | Keep dotted endpoints explicit; do not rely on i18n proxy for them |
| Partial translations create thin English pages | Return 404 for untranslated English articles until an editorial fallback is chosen |

## Open Questions

- Should English post slugs stay identical to Chinese canonical slugs, or should translated slugs be allowed?
- Should `/en/rss.xml` launch with the first English article or wait until there are at least three English entries?
- Should region/category taxonomy be translated immediately or only displayed through message mappings?

Recommended defaults: keep slugs identical at first, delay English RSS until real English content exists, and translate taxonomy display labels through messages while keeping stored taxonomy keys stable.
