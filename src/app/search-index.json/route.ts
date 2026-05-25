import { getCyclingSearchIndex } from "@/lib/cycling";
import { getSearchIndex } from "@/lib/posts";

export const dynamic = "force-static";

export function GET() {
  const posts = [...getSearchIndex(), ...getCyclingSearchIndex()].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      posts,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
