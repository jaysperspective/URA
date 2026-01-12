// web/src/app/api/lunation/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppBaseUrl() {
  const base =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    "";

  if (base) return base.replace(/\/$/, "");
  return "http://127.0.0.1:3000";
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

function buildLunationText(core: any) {
  const input = core?.input;
  const lun = core?.derived?.lunation;

  const lines: string[] = [];
  lines.push("URA • Progressed Lunation Model");
  lines.push("");

  if (input?.birth_datetime && input?.tz_offset) {
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
  }
  if (core?.birthUTC) lines.push(`Birth (UTC):   ${String(core.birthUTC).replace(".000Z", "Z")}`);
  if (input?.as_of_date) lines.push(`As-of (UTC):   ${input.as_of_date}`);
  lines.push("");

  if (lun?.progressedDateUTC) lines.push(`Progressed date (UTC): ${lun.progressedDateUTC.replace(".000Z", "Z")}`);
  lines.push("");

  const pSun = lun?.progressedSunLon;
  const pMoon = lun?.progressedMoonLon;
  if (typeof pSun === "number") lines.push(`Progressed Sun lon:  ${pSun.toFixed(2)}° (${angleToSign(pSun)})`);
  if (typeof pMoon === "number") lines.push(`Progressed Moon lon: ${pMoon.toFixed(2)}° (${angleToSign(pMoon)})`);

  if (typeof lun?.separation === "number") lines.push(`Separation: ${lun.separation.toFixed(2)}°`);
  lines.push("");

  if (lun?.phase) lines.push(`Current phase: ${lun.phase}`);
  if (lun?.subPhase?.label) {
    const seg =
      lun?.subPhase?.segment && lun?.subPhase?.total ? ` (segment ${lun.subPhase.segment}/${lun.subPhase.total})` : "";
    lines.push(`Current sub-phase: ${lun.subPhase.label}${seg}`);
  }
  if (typeof lun?.subPhase?.within === "number") lines.push(`Degrees into phase: ${lun.subPhase.within.toFixed(2)}°`);

  lines.push("");
  lines.push("Current cycle boundaries:");
  const boundaries = Array.isArray(lun?.boundaries) ? lun.boundaries : [];
  for (const b of boundaries) {
    if (!b?.label || !b?.dateUTC) continue;
    lines.push(`- ${b.label}: ${b.dateUTC}`);
  }
  if (lun?.nextNewMoonUTC) lines.push(`- Next New Moon (360°): ${lun.nextNewMoonUTC}`);

  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const base = getAppBaseUrl();

    const r = await fetch(`${base}/api/core`, {
      method: "POST",
      headers: {
        "content-type": req.headers.get("content-type") || "text/plain",
        "cache-control": "no-store",
      },
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
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        text: buildLunationText(core),
        summary: core?.derived?.summary ?? null,
        lunation: core?.derived?.lunation ?? null,
        input: core?.input ?? null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
