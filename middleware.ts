import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that never require auth or plan check
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/webhooks",
];

// Single-segment paths are public booking pages  (/barba-do-joao, etc.)
const BOOKING_PATTERN = /^\/[a-z0-9-]+$/;

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) return true;
  if (BOOKING_PATTERN.test(pathname)) return true;
  return false;
}

const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "__starter__";

function isPaidPlan(priceId: string | null | undefined): boolean {
  return !!priceId && priceId !== STARTER_PRICE_ID;
}

export default auth(async (req: NextRequest & { auth: { user?: unknown } | null }) => {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) return NextResponse.next();

  // ── Not authenticated ────────────────────────────────────────────────────────
  if (!req.auth?.user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // ── Read values directly from the JWT (set in auth.ts callbacks) ─────────────
  // All routing decisions are made from JWT only — no DB calls in middleware
  // (middleware runs in Edge runtime where standard Prisma is not supported).
  const user = req.auth.user as {
    organizationId?: string | null;
    pendingPriceId?: string | null;
    planStatus?: string | null;
    trialEndsAt?: string | null;
    hasUnit?: boolean;
  };

  const organizationId = user.organizationId ?? null;
  const pendingPriceId = user.pendingPriceId ?? null;
  const planStatus = user.planStatus ?? null;
  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const hasUnit = user.hasUnit ?? false;

  // ── No org yet (new user, pre-payment or pre-onboarding) ────────────────────
  if (!organizationId) {
    if (isPaidPlan(pendingPriceId)) {
      // Must pay before accessing anything else
      if (!pathname.startsWith("/payment")) {
        return NextResponse.redirect(new URL("/payment", req.url));
      }
    } else {
      // Starter / no plan — go to onboarding
      if (!pathname.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }
    return NextResponse.next();
  }

  // ── User has an org ──────────────────────────────────────────────────────────

  // Redirect away from /payment (already has org)
  if (pathname.startsWith("/payment")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Guard /onboarding: only accessible if user has no units yet
  if (pathname.startsWith("/onboarding")) {
    if (hasUnit) {
      return NextResponse.redirect(new URL("/settings/units", req.url));
    }
    return NextResponse.next();
  }

  // Skip plan check for /subscribe
  if (pathname.startsWith("/subscribe")) {
    return NextResponse.next();
  }

  // ── Plan / Trial enforcement (JWT — no DB read needed) ──────────────────────
  const now = new Date();

  if (planStatus === "ACTIVE") return NextResponse.next();

  if (planStatus === "TRIAL" && trialEndsAt && now < trialEndsAt) {
    return NextResponse.next();
  }

  // Blocked or trial expired
  return NextResponse.redirect(new URL("/subscribe", req.url));
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
