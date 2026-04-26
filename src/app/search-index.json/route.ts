import { getSearchIndex } from "@/lib/posts";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      posts: getSearchIndex(),
    },
    {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
