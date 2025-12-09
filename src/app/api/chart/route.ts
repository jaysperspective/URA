// src/app/api/chart/route.ts

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Call the local astro-service running on port 3002
    const astroRes = await fetch("http://127.0.0.1:3002/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!astroRes.ok) {
      const errText = await astroRes.text();
      return NextResponse.json(
        { ok: false, error: errText },
        { status: 500 }
      );
    }

    const data = await astroRes.json();
    return NextResponse.json(data); // Forward astro-service result directly
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
