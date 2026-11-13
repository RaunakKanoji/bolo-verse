import { NextResponse, type NextRequest } from "next/server";
import { portalTarget } from "./lib/portal-target";

export default function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
  const origin =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_APP_URL
      : process.env.WEB_INTERNAL_ORIGIN ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://127.0.0.1:3000";
  const target = portalTarget(origin, request.nextUrl.pathname, request.nextUrl.search);
  if (!target || target.origin === request.nextUrl.origin) return NextResponse.next();
  const response = NextResponse.redirect(target, 307);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: [
    "/",
    "/workspace",
    "/projects/:path*",
    "/brainstorm/:path*",
    "/review/:path*",
    "/assets/:path*",
    "/clients/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/spatial-studio/:path*",
    "/recording-lab/:path*",
    "/app/:path*",
    "/studio/:path*",
    "/reviews/:path*",
    "/xr/:path*",
    "/create/:path*",
  ],
};
