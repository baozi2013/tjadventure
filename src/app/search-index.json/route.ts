import { getCyclingSearchIndex } from "@/lib/cycling";
import { getSearchIndex } from "@/lib/posts";
import { isSupportedLocale, routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const requestedLocale = new URL(request.url).searchParams.get("locale") ?? routing.defaultLocale;
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : routing.defaultLocale;
  const posts = [...getSearchIndex(locale), ...getCyclingSearchIndex(locale)].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      locale,
      posts,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
