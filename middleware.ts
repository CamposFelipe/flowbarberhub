import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Routes that never require auth or plan check
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/subscribe",
  "/api/auth",
  "/api/webhooks",
];

// Booking pages are public but handled separately
const BOOKING_PATTERN = /^\/[a-z0-9-]+$/;

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) return true;
  // /[unit-slug] — single-segment paths are public booking pages
  if (BOOKING_PATTERN.test(pathname)) return true;
  return false;
}

export default auth(async (req: NextRequest & { auth: { user?: { id: string; organizationId?: string | null } } | null }) => {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Not authenticated → redirect to login
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { organizationId } = req.auth.user;

  // User has no organization yet → send to onboarding
  if (!organizationId) {
    if (!pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }

  // Skip plan check for subscribe and onboarding routes
  if (pathname.startsWith("/onboarding") || pathname.startsWith("/subscribe")) {
    return NextResponse.next();
  }

  // ── Plan / Trial enforcement ──────────────────────────────────────────────
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { planStatus: true, trialEndsAt: true },
  });

  if (!org) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const now = new Date();

  // ACTIVE plan → allow
  if (org.planStatus === "ACTIVE") {
    return NextResponse.next();
  }

  // TRIAL and still within trial window → allow
  if (org.planStatus === "TRIAL" && now < org.trialEndsAt) {
    return NextResponse.next();
  }

  // BLOCKED or trial expired → redirect to subscribe
  return NextResponse.redirect(new URL("/subscribe", req.url));
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
