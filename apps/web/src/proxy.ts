import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { spatialTarget } from "@/lib/routing/spatial-target";

const verifyClerk = clerkMiddleware();

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const target = spatialTarget(process.env.SPATIAL_WEB_ORIGIN || "http://127.0.0.1:3001", request.nextUrl.pathname, request.nextUrl.search);
  // The spatial shell authenticates private bootstrap reads through this web
  // app's API. No Clerk identity headers or caller-selected origins are trusted.
  if (target) return NextResponse.rewrite(target);
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    // Keep public setup/feasibility screens available. Every data route fails closed itself.
    return NextResponse.next();
  }
  return verifyClerk(request, event);
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/spatial-static/:path*",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
