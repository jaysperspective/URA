// src/app/seasons/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AstroInputForm, { type AstroPayloadText } from "@/components/astro/AstroInputForm";

const LS_PAYLOAD_KEY = "ura:lastPayloadText";

// ---- Types (kept compatible with existing UI) ----

type AscYearResponse = {
  ok: boolean;
  ascYear?: {
    anchorAsc?: number;
    cyclePosition?: number;
    season?: string;
    modality?: string;
    modalitySegment?: string;
    degreesIntoModality?: number;
    boundariesLongitude?: Record<string, number>;
    // allow extra keys
    [k: string]: any;
  };
  natal?: {
    ascendant?: number;
    mc?: number;
    houses?: number[];
    bodies?: Record<string, { lon?: number | null }>;
    [k: string]: any;
  };
  transit?: {
    sunLon?: number | null;
    [k: string]: any;
  };
  // allow extra keys
  [k: string]: any;
};

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

function fmtDeg(x: any) {
  return typeof x === "number" && Number.isFinite(x) ? `${x.toFixed(2)}°` : "—";
}

// ---- Page ----

export default function SeasonsPage() {
  const [data, setData] = useState<AscYearResponse | null>(null);
  const [errorOut, setErrorOut] = useState<string>("");
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

    setErrorOut("");
    setData(null);

    // ✅ Single Core API call
    const out = await postText("/api/core", payloadText);

    if (!out.res.ok || out.data?.ok === false) {
      setErrorOut(pretty({ status: out.res.status, error: out.data?.error, data: out.data }));
      return;
    }

    const core = out.data;

    // Adapt /api/core to the existing Seasons UI expectations
    const adapted: AscYearResponse = {
      ok: true,
      ascYear: core?.derived?.ascYear,
      natal: core?.natal,
      transit: {
        sunLon: core?.asOf?.bodies?.sun?.lon ?? null,
      },
      // keep the whole core payload around for debugging if you want
      core,
    };

    setData(adapted);
  }

  const asc = data?.natal?.ascendant;
  const mc = data?.natal?.mc;
  const sunT = data?.transit?.sunLon;
  const cyclePos = data?.ascYear?.cyclePosition;

  return (
    <div className="min-h-[100svh] bg-black text-neutral-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-5">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase">
                URA • Seasons
              </div>
              <div className="mt-2 text-[26px] leading-[1.05] font-semibold">
                Ascendant Year Cycle (12×30°)
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
                href="/lunation"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-[12px] text-neutral-100 hover:bg-neutral-800"
              >
                Go to /lunation
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

        {errorOut ? (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-5">
            <div className="text-[12px] tracking-[0.18em] text-red-200 uppercase mb-2">
              Error
            </div>
            <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-red-100">
              {errorOut}
            </pre>
          </div>
        ) : null}

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
              Readout
            </div>

            {!data ? (
              <div className="text-[12px] text-neutral-400">Generate to compute your season.</div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
                  <div className="text-[12px] text-neutral-400 mb-1">Ascendant Year</div>
                  <div className="text-[18px] font-semibold leading-tight">
                    {data?.ascYear?.season ?? "—"} · {data?.ascYear?.modality ?? "—"}
                  </div>
                  <div className="mt-2 text-[12px] text-neutral-300">
                    Cycle position: <span className="text-neutral-100">{fmtDeg(cyclePos)}</span>
                  </div>
                  <div className="mt-1 text-[12px] text-neutral-400">
                    {data?.ascYear?.modalitySegment ? data.ascYear.modalitySegment : ""}
                    {typeof data?.ascYear?.degreesIntoModality === "number"
                      ? ` · ${data.ascYear.degreesIntoModality.toFixed(2)}° into segment`
                      : ""}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
                  <div className="text-[12px] text-neutral-400 mb-1">Angles + Transit Sun</div>
                  <div className="text-[12px] text-neutral-200">
                    Natal ASC:{" "}
                    <span className="text-neutral-100">
                      {fmtDeg(asc)} {typeof asc === "number" ? `(${angleToSign(asc)})` : ""}
                    </span>
                  </div>
                  <div className="text-[12px] text-neutral-200">
                    Natal MC:{" "}
                    <span className="text-neutral-100">
                      {fmtDeg(mc)} {typeof mc === "number" ? `(${angleToSign(mc)})` : ""}
                    </span>
                  </div>
                  <div className="text-[12px] text-neutral-200">
                    Transit Sun:{" "}
                    <span className="text-neutral-100">
                      {fmtDeg(sunT)} {typeof sunT === "number" ? `(${angleToSign(sunT)})` : ""}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase mb-2">
              Debug (core payload)
            </div>
            <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-neutral-200">
              {!data ? "Generate to view /api/core output." : pretty(data.core ?? data)}
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
