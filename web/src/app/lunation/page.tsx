// src/app/lunation/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AstroInputForm, { type AstroPayloadText } from "@/components/astro/AstroInputForm";

const LS_PAYLOAD_KEY = "ura:lastPayloadText";

type AstroFormInitial = {
  birthDate?: string;
  birthTime?: string;
  timeZone?: string;
  birthCityState?: string;
  lat?: number;
  lon?: number;
  asOfDate?: string;
};

function safeParsePayloadTextToInitial(payloadText: string): Partial<AstroFormInitial> {
  const get = (k: string) => {
    const re = new RegExp(`^\\s*${k}\\s*:\\s*(.+?)\\s*$`, "mi");
    const m = payloadText.match(re);
    return m?.[1]?.trim() ?? null;
  };

  const birthDT = get("birth_datetime");
  const asOf = get("as_of_date");
  const latRaw = get("lat");
  const lonRaw = get("lon");

  let birthDate: string | undefined;
  let birthTime: string | undefined;

  if (birthDT) {
    const m = birthDT.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/);
    if (m) {
      birthDate = m[1];
      birthTime = m[2];
    }
  }

  const lat = latRaw ? Number(latRaw) : undefined;
  const lon = lonRaw ? Number(lonRaw) : undefined;

  return {
    birthDate,
    birthTime,
    timeZone: "America/New_York",
    birthCityState: "",
    lat: Number.isFinite(lat as number) ? (lat as number) : undefined,
    lon: Number.isFinite(lon as number) ? (lon as number) : undefined,
    asOfDate: asOf ?? undefined,
  };
}

function pretty(x: any) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function fmtYMDHM(isoOrDate: any) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(String(isoOrDate));
  if (Number.isNaN(d.getTime())) return String(isoOrDate ?? "");
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function fmtYMD(isoOrDate: any) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(String(isoOrDate));
  if (Number.isNaN(d.getTime())) return String(isoOrDate ?? "");
  return d.toISOString().slice(0, 10);
}

function angleToSign(deg: number) {
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
  const w = ((deg % 360) + 360) % 360;
  return signs[Math.floor(w / 30)] || "Aries";
}

function buildLunationText(core: any) {
  const input = core?.input;
  const lun = core?.derived?.lunation;
  if (!lun) return "";

  const lines: string[] = [];
  lines.push("URA • Progressed Lunation Model");
  lines.push("");
  if (input) {
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
    if (core?.birthUTC) lines.push(`Birth (UTC):   ${fmtYMDHM(core.birthUTC)}`);
    if (input?.as_of_date) lines.push(`As-of (UTC):   ${input.as_of_date}`);
  }
  lines.push("");
  if (lun.progressedDateUTC) lines.push(`Progressed date (UTC): ${fmtYMDHM(lun.progressedDateUTC)}`);
  lines.push("");
  if (typeof lun.progressedSunLon === "number")
    lines.push(`Progressed Sun lon:  ${lun.progressedSunLon.toFixed(2)}°`);
  if (typeof lun.progressedMoonLon === "number")
    lines.push(`Progressed Moon lon: ${lun.progressedMoonLon.toFixed(2)}°`);
  if (typeof lun.separation === "number")
    lines.push(`Separation (Sun→Moon): ${lun.separation.toFixed(2)}°`);
  lines.push("");
  if (lun.phase) lines.push(`Current phase: ${lun.phase}`);
  if (lun.subPhase?.label) {
    lines.push(
      `Current sub-phase: ${lun.subPhase.label} (segment ${lun.subPhase.segment}/${lun.subPhase.total})`
    );
    if (typeof lun.subPhase.within === "number")
      lines.push(`Degrees into phase: ${lun.subPhase.within.toFixed(2)}°`);
  }
  lines.push("");
  lines.push("Current cycle boundaries:");
  const b = Array.isArray(lun.boundaries) ? lun.boundaries : [];
  for (const item of b) {
    const label = item?.label ?? "";
    const date = item?.dateUTC ? fmtYMD(item.dateUTC) : "";
    if (label && date) lines.push(`- ${label}: ${date}`);
  }
  if (lun.nextNewMoonUTC) lines.push(`- Next New Moon (360°): ${fmtYMD(lun.nextNewMoonUTC)}`);

  return lines.join("\n");
}

function buildAscYearText(core: any) {
  const input = core?.input;
  const ay = core?.derived?.ascYear;
  const natal = core?.natal;
  const asOf = core?.asOf;

  if (!ay || !natal || !asOf) return "";

  const lines: string[] = [];
  lines.push("URA • Ascendant Year Cycle");
  lines.push("");
  if (input) {
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
    if (core?.birthUTC) lines.push(`Birth (UTC):   ${fmtYMDHM(core.birthUTC)}`);
    if (input?.as_of_date) lines.push(`As-of (UTC):   ${input.as_of_date} 00:00`);
  }
  lines.push("");
  if (typeof natal.ascendant === "number")
    lines.push(`Natal ASC:  ${natal.ascendant.toFixed(2)}° (${angleToSign(natal.ascendant)})`);
  if (typeof natal.mc === "number")
    lines.push(`Natal MC:   ${natal.mc.toFixed(2)}° (${angleToSign(natal.mc)})`);

  const ns = natal?.bodies?.sun?.lon;
  const nm = natal?.bodies?.moon?.lon;
  if (typeof ns === "number") lines.push(`Natal Sun:  ${ns.toFixed(2)}° (${angleToSign(ns)})`);
  if (typeof nm === "number") lines.push(`Natal Moon: ${nm.toFixed(2)}° (${angleToSign(nm)})`);

  lines.push("");

  const ts = asOf?.bodies?.sun?.lon;
  if (typeof ts === "number") lines.push(`Transiting Sun: ${ts.toFixed(2)}° (${angleToSign(ts)})`);

  lines.push("");
  if (typeof ay.cyclePosition === "number")
    lines.push(`Cycle position (Sun from ASC): ${ay.cyclePosition.toFixed(2)}°`);
  if (ay.season) lines.push(`Season: ${ay.season}`);
  if (ay.modality)
    lines.push(`Modality: ${ay.modality}${ay.modalitySegment ? ` (${ay.modalitySegment})` : ""}`);
  if (typeof ay.degreesIntoModality === "number")
    lines.push(`Degrees into modality: ${ay.degreesIntoModality.toFixed(2)}°`);

  lines.push("");
  lines.push("Boundaries (longitude, 30°):");
  const bl = ay.boundariesLongitude || {};
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

async function postText(endpoint: string, text: string) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: text,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    const raw = await res.text().catch(() => "");
    data = { ok: false, error: "Non-JSON response", raw };
  }

  return { res, data };
}

export default function LunationConsolePage() {
  const [lunationOut, setLunationOut] = useState<string>("");
  const [ascYearOut, setAscYearOut] = useState<string>("");
  const [payloadOut, setPayloadOut] = useState<string>("");

  const [savedPayload, setSavedPayload] = useState<string>("");

  useEffect(() => {
    try {
      const x = window.localStorage.getItem(LS_PAYLOAD_KEY) || "";
      setSavedPayload(x);
      if (x) setPayloadOut(x);
    } catch {
      // ignore
    }
  }, []);

  const initial = useMemo<AstroFormInitial>(() => {
    if (!savedPayload) return {};
    return safeParsePayloadTextToInitial(savedPayload);
  }, [savedPayload]);

  function persistPayload(payloadText: string) {
    try {
      window.localStorage.setItem(LS_PAYLOAD_KEY, payloadText);
      setSavedPayload(payloadText);
    } catch {
      // ignore
    }
  }

  async function handleGenerate(payloadText: AstroPayloadText) {
    setPayloadOut(payloadText);
    persistPayload(payloadText);

    setLunationOut("");
    setAscYearOut("");

    const core = await postText("/api/core", payloadText);

    if (!core.res.ok || core.data?.ok === false) {
      const err = pretty({ status: core.res.status, error: core.data?.error, data: core.data });
      setLunationOut(err);
      setAscYearOut(err);
      return;
    }

    const lunText = buildLunationText(core.data);
    const ascText = buildAscYearText(core.data);

    setLunationOut(lunText || (core.data?.text ? String(core.data.text) : pretty(core.data)));
    setAscYearOut(ascText || (core.data?.text ? String(core.data.text) : pretty(core.data)));
  }

  return (
    <div className="min-h-[100svh] bg-black text-neutral-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-5">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase">
                URA • Lunation
              </div>
              <div className="mt-2 text-[26px] leading-[1.05] font-semibold">
                Progressed Lunation + Ascendant Year Cycle
              </div>
              <div className="mt-2 text-[13px] text-neutral-400">
                Now powered by <span className="text-neutral-200">/api/core</span> (single request).
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/input"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-[12px] text-neutral-100 hover:bg-neutral-800"
              >
                Edit input
              </Link>
              <Link
                href="/seasons"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-[12px] text-neutral-100 hover:bg-neutral-800"
              >
                Go to /seasons
              </Link>
            </div>
          </div>
        </div>

        <AstroInputForm
          title="URA • Input"
          lockAsOfToToday
          initial={{
            birthTime: initial.birthTime ?? "01:39",
            timeZone: initial.timeZone ?? "America/New_York",
            birthCityState: initial.birthCityState ?? "Danville, VA",
            lat: typeof initial.lat === "number" ? initial.lat : 36.585,
            lon: typeof initial.lon === "number" ? initial.lon : -79.395,
          }}
          onGenerate={handleGenerate}
        />

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase mb-2">
            Payload (text/plain)
          </div>
          <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-neutral-200">
            {payloadOut || "Generate to view the request payload."}
          </pre>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase mb-2">
              URA • Progressed Lunation Model (from /api/core)
            </div>
            <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-neutral-200">
              {lunationOut || "Generate to run /api/core."}
            </pre>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase mb-2">
              URA • Ascendant Year Cycle (from /api/core)
            </div>
            <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-neutral-200">
              {ascYearOut || "Generate to run /api/core."}
            </pre>
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 px-1">
          Reuses the last saved payload from{" "}
          <span className="text-neutral-300">{LS_PAYLOAD_KEY}</span>.
        </div>
      </div>
    </div>
  );
}
