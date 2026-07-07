import { createRssResponse } from "@/lib/rss";

export function GET() {
  return createRssResponse("en-US");
}
