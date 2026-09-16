import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper function to decode JWT token and check expiration
function isTokenExpired(token: string): boolean {
  try {
    // Decode the JWT token (assuming it's a JWT)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);

    // Check if the token has an exp claim and if it's expired
    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    }

    // If no exp claim, assume token doesn't expire
    return false;
  } catch (error) {
    // If we can't decode the token, consider it invalid/expired
    console.warn("Failed to decode token:", error);
    return true;
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to auth pages without authentication
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/resend-email-verification")
  ) {
    return NextResponse.next();
  }

  // Allow access to API routes (they handle their own auth)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Check for access token in httpOnly cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // If no access token, redirect to login
  if (!accessToken) {
    console.log("No access token found, redirecting to login");
    const loginUrl = new URL("/auth/login", request.url);
    // Add a query parameter to indicate why they were redirected
    loginUrl.searchParams.set("reason", "unauthenticated");
    return NextResponse.redirect(loginUrl);
  }

  // Check if the access token is expired
  if (isTokenExpired(accessToken)) {
    console.log(
      "Access token expired, clearing tokens and redirecting to login",
    );

    // Create response with token clearing
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("reason", "token_expired");

    const response = NextResponse.redirect(loginUrl);

    // Clear both access and refresh tokens
    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });

    return response;
  }

  // Allow access to protected routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|manifest.json|manifest.webmanifest|sw.js|favicon.ico|icons|images|.*\\.png|.*\\.svg|.*\\.ico).*)",
  ],
};
