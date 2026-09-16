import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Audit log endpoint - available for server-side logging or telemetry
    if (process.env.NODE_ENV === "development") {
      console.log("[Auth Log]", body);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
