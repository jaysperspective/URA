// web/src/app/api/asc-year/route.ts

import { NextResponse } from "next/server";

function buildOrigin(req: Request) {
  // Works behind Nginx/Cloudflare too
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "http";
  return `${proto}://${host}`;
}

function angleToSign(lon: number) {
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  const x = ((lon % 360) + 360) % 360;
  return signs[Math.floor(x / 30)] ?? "—";
}

function buildAscYearText(core: any) {
  const input = core?.input;
  const natal = core?.natal;
  const asOf = core?.asOf;
  const ay = core?.derived?.ascYear;

  const lines: string[] = [];
  lines.push("URA • Ascendant Year Cycle");
  lines.push("");

  if (input?.birth_datetime && input?.tz_offset) {
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
  }
  if (core?.birthUTC) lines.push(`Birth (UTC):   ${String(core.birthUTC).replace(".000Z", "Z")}`);
  if (core?.asOfUTC) lines.push(`As-of (UTC):   ${String(core.asOfUTC).replace(".000Z", "Z")}`);
  lines.push("");

  const nAsc = natal?.ascendant;
  const nMc = natal?.mc;
  const nSun = natal?.bodies?.sun?.lon;
  const nMoon = natal?.bodies?.moon?.lon;

  if (typeof nAsc === "number") lines.push(`Natal ASC:  ${nAsc.toFixed(2)}° (${angleToSign(nAsc)})`);
  if (typeof nMc === "number") lines.push(`Natal MC:   ${nMc.toFixed(2)}° (${angleToSign(nMc)})`);
  if (typeof nSun === "number") lines.push(`Natal Sun:  ${nSun.toFixed(2)}° (${angleToSign(nSun)})`);
  if (typeof nMoon === "number") lines.push(`Natal Moon: ${nMoon.toFixed(2)}° (${angleToSign(nMoon)})`);

  // Optional natal bodies if present
  const nb = natal?.bodies || {};
  const addBody = (key: string, label: string) => {
    const v = nb?.[key]?.lon;
    if (typeof v === "number") lines.push(`Natal ${label}: ${v.toFixed(2)}° (${angleToSign(v)})`);
  };
  addBody("mercury", "Mercury");
  addBody("venus", "Venus");
  addBody("mars", "Mars");
  addBody("jupiter", "Jupiter");
  addBody("saturn", "Saturn");
  addBody("uranus", "Uranus");
  addBody("neptune", "Neptune");
  addBody("pluto", "Pluto");
  addBody("chiron", "Chiron");
  addBody("northNode", "North Node");
  addBody("southNode", "South Node");

  lines.push("");

  const tSun = asOf?.bodies?.sun?.lon;
  if (typeof tSun === "number") lines.push(`Transiting Sun: ${tSun.toFixed(2)}° (${angleToSign(tSun)})`);

  lines.push("");
  if (typeof ay?.cyclePosition === "number")
    lines.push(`Cycle position (Sun from ASC): ${ay.cyclePosition.toFixed(2)}°`);
  if (ay?.season) lines.push(`Season: ${ay.season}`);
  if (ay?.modality) {
    const seg = ay?.modalitySegment ? ` (${ay.modalitySegment})` : "";
    lines.push(`Modality: ${ay.modality}${seg}`);
  }
  if (typeof ay?.degreesIntoModality === "number")
    lines.push(`Degrees into modality: ${ay.degreesIntoModality.toFixed(2)}°`);

  lines.push("");
  lines.push("Boundaries (longitude, 30°):");
  const bl = ay?.boundariesLongitude || {};
  for (let i = 0; i <= 12; i++) {
    const key = `deg${i * 30}`;
    const v = bl[key];
    if (typeof v === "number") {
      const label = `${i * 30}°`.padEnd(4, " ");
      lines.push(`- ${label} ${v.toFixed(2)}°`);
    }
  }

  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const origin = buildOrigin(req);

    const r = await fetch(`${origin}/api/core`, {
      method: "POST",
      headers: { "content-type": req.headers.get("content-type") || "text/plain" },
      body,
      cache: "no-store",
    });

    const core = await r.json().catch(async () => {
      const raw = await r.text().catch(() => "");
      return { ok: false, error: "Non-JSON response from /api/core", raw };
    });

    if (!r.ok || core?.ok === false) {
      return NextResponse.json(
        { ok: false, error: core?.error || `core failed (${r.status})`, core },
        { status: 500 }
      );
    }

    // ✅ Contract: wrappers always return summary + their slice
    return NextResponse.json({
      ok: true,
      text: buildAscYearText(core),
      summary: core?.derived?.summary ?? null,
      ascYear: core?.derived?.ascYear ?? null,
      natal: core?.natal ?? null,
      asOf: core?.asOf ?? null,
      input: core?.input ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 400 });
  }
}
