import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Set httpOnly cookies directly on the response to guarantee Set-Cookie headers in all environments
    response.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    if (refresh_token) {
      response.cookies.set("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to set token" }, { status: 500 });
  }
}
