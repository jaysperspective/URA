// src/app/api/astrology/route.ts
import { NextResponse } from "next/server";
import { parsePlacement } from "@/lib/doctrine/parse";

// src/lib/doctrine/doctrine.generated.json
import doctrine from "@/lib/doctrine/doctrine.generated.json";

type DoctrineCard = any;

const cards: DoctrineCard[] = (doctrine as any).cards ?? [];
const LOOKUP = new Map<string, DoctrineCard>(cards.map((c) => [c.key, c]));

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json(
        { ok: false, error: "Missing query. Try ?q=Mars Virgo OR ?q=Mars Virgo 6th house" },
        { status: 400 }
      );
    }

    const { planet, sign, house } = parsePlacement(q);

    // ✅ House optional keying:
    // - placement-only: "mars|virgo"
    // - with house:     "mars|virgo|6"
    const key = house != null ? `${planet}|${sign}|${house}` : `${planet}|${sign}`;

    const card = LOOKUP.get(key);
    if (!card) {
      return NextResponse.json(
        { ok: false, error: `No doctrine card found for ${key}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, key, card });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 400 }
    );
  }
}
