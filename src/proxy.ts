import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const NEXT_INTL_LOCALE_HEADER = "X-NEXT-INTL-LOCALE";
const INTERNAL_LOCALE_PATH = /^\/(?:zh-CN|en-US)(?:\/|$)/;

export default function proxy(request: NextRequest) {
  if (request.headers.has(NEXT_INTL_LOCALE_HEADER) && INTERNAL_LOCALE_PATH.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
