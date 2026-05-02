import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const MANAGER_ONLY = ["/dashboard", "/forecast", "/shifts", "/settings"];
const APP_ROUTES = ["/dashboard", "/forecast", "/shifts", "/settings", "/bulletin", "/my-shifts"];

export async function middleware(req: NextRequest) {
  // CSP nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const { response, user, claims } = await updateSession(req);
  const { pathname, origin } = req.nextUrl;

  const needsAuth = APP_ROUTES.some((p) => pathname.startsWith(p));
  if (needsAuth && !user) {
    const url = new URL("/login", origin);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const managerOnly = MANAGER_ONLY.some((p) => pathname.startsWith(p));
  if (managerOnly && user && claims.role !== "manager") {
    return NextResponse.redirect(new URL("/my-shifts", origin));
  }

  // Manager without store_id → onboarding (first-run setup)
  if (
    user &&
    claims.role === "manager" &&
    !claims.store_id &&
    !pathname.startsWith("/onboarding") &&
    pathname !== "/login"
  ) {
    return NextResponse.redirect(new URL("/onboarding", origin));
  }

  // CSP — strict, nonce-based
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
