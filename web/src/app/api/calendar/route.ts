// web/src/app/api/calendar/route.ts
import { NextResponse } from "next/server";
import {
  getCalendarForYMD,
  TZ,
} from "@/lib/calendar/calendar";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ymd = searchParams.get("ymd") || null;

    const out = await getCalendarForYMD(ymd);

    return NextResponse.json(out, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "calendar error" },
      { status: 500 }
    );
  }
}
