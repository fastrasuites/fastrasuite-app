import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper function to decode JWT token and check expiration safely
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);

    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    }

    return false;
  } catch {
    // If decoding fails, don't assume expired; allow request to proceed to client
    return false;
  }
}

export default function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Allow public auth pages and verification routes
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/resend-email-verification") ||
    pathname.startsWith("/project-costing/dashboard-preview")
  ) {
    return NextResponse.next();
  }

  // 2. Allow API routes (they validate their own auth headers)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 3. Check for payment return callbacks (Paystack redirect)
  // NEVER block a user returning from Paystack with a transaction reference
  const isPaymentCallback =
    searchParams.has("reference") ||
    searchParams.has("trxref") ||
    searchParams.has("verify_invoice");

  if (isPaymentCallback) {
    return NextResponse.next();
  }

  // 4. Check for auth tokens in cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // 5. If neither access token nor refresh token is present, redirect to login
  if (!accessToken && !refreshToken) {
    console.log("No auth tokens found, redirecting to login");
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("reason", "unauthenticated");
    const fullPath = request.nextUrl.pathname + request.nextUrl.search;
    if (fullPath && fullPath !== "/") {
      loginUrl.searchParams.set("redirect", fullPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 6. If access token is expired, but a valid refresh token exists, let request proceed
  // The client-side session / RTK Query handles transparent token refreshes
  if (accessToken && isTokenExpired(accessToken) && !refreshToken) {
    console.log("Access token expired and no refresh token found, redirecting to login");
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("reason", "token_expired");
    const fullPath = request.nextUrl.pathname + request.nextUrl.search;
    if (fullPath && fullPath !== "/") {
      loginUrl.searchParams.set("redirect", fullPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Allow access to protected routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static asset files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
