// src/app/api/astrology/route.ts
import { NextResponse } from "next/server";
import { parsePlacement } from "@/lib/doctrine/parse";

// Important: this JSON is generated and committed into your repo at:
// src/lib/doctrine/doctrine.generated.json
import doctrine from "@/lib/doctrine/doctrine.generated.json";

type DoctrineCard = any;

const cards: DoctrineCard[] = (doctrine as any).cards ?? [];
const LOOKUP = new Map<string, DoctrineCard>(cards.map((c) => [c.key, c]));

function titleize(s: string) {
  return (s || "")
    .split("_")
    .map((x) => (x ? x[0].toUpperCase() + x.slice(1) : x))
    .join(" ");
}

/**
 * Build a "house-less" core placement card from an exemplar.
 * This allows queries like "Moon Capricorn" without forcing a house.
 */
function buildCorePlacementCard(exemplar: DoctrineCard, planet: string, sign: string) {
  const planetName = titleize(planet);
  const signName = titleize(sign);

  const out = {
    ...exemplar,
    // override the key/labels to reflect that house is unspecified
    key: `${planet}|${sign}`,
    labels: {
      ...(exemplar.labels ?? {}),
      placement: `${planetName} ${signName}`,
      house: undefined,
    },
    // arena is house-specific; remove / soften it
    arena: {
      domain: "House not specified (core placement only).",
    },
    // keep function/style (planet/sign) which are the main value here
  };

  return out;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json(
        { ok: false, error: "Missing query. Try ?q=Mars Virgo or ?q=Mars Virgo 6th house" },
        { status: 400 }
      );
    }

    const { planet, sign, house } = parsePlacement(q);

    // ✅ If house provided, do exact lookup
    if (typeof house === "number") {
      const key = `${planet}|${sign}|${house}`;
      const card = LOOKUP.get(key);

      if (!card) {
        return NextResponse.json(
          { ok: false, error: `No doctrine card found for ${key}.` },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true, key, card });
    }

    // ✅ If house NOT provided, return a “core placement” card
    const prefix = `${planet}|${sign}|`;
    const exemplar = cards.find((c) => typeof c?.key === "string" && c.key.startsWith(prefix));

    if (!exemplar) {
      return NextResponse.json(
        { ok: false, error: `No doctrine cards found for ${planet}|${sign} (any house).` },
        { status: 404 }
      );
    }

    const key = `${planet}|${sign}`;
    const card = buildCorePlacementCard(exemplar, planet, sign);

    return NextResponse.json({ ok: true, key, card });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 400 }
    );
  }
}
