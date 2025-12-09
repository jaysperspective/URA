import { NextResponse } from "next/server";
import rateLimit from "express-rate-limit";

export const POST = rateLimit({
  windowMs: 5000,   // 5 seconds
  max: 20,          // 20 requests max
  message: "Too many requests. Slow down."
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const astroRes = await fetch("http://127.0.0.1:3002/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!astroRes.ok) {
      const errText = await astroRes.text();
      return NextResponse.json({ ok: false, error: errText }, { status: 500 });
    }

    const data = await astroRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
