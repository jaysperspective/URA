// src/app/api/sun/route.ts
// Collective sun/lunar data endpoint - NO personal/birth/auth data
import { NextRequest, NextResponse } from "next/server";
import { withStandardRateLimit } from "@/lib/withRateLimit";
import { getCollectiveData } from "@/lib/sun/collectiveData";

export const runtime = "nodejs";

async function handleGet(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const tzOffsetMin = Number(searchParams.get("tzOffsetMin") ?? "0");
  const latitude = Number(searchParams.get("lat") ?? "0");
  const longitude = Number(searchParams.get("lon") ?? "0");

  const data = await getCollectiveData({ tzOffsetMin, latitude, longitude });

  if (!data.ok) {
    return NextResponse.json(data, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=600, s-maxage=600" },
  });
}

export const GET = withStandardRateLimit(handleGet);
