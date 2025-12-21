"use client";

import React, { useMemo, useState } from "react";
import AstroInputForm, { type AstroPayloadText } from "@/components/astro/AstroInputForm";

type AscYearResponse = {
  ok: boolean;
  error?: string;
  text?: string;
  ascYear?: {
    anchorAsc: number;
    cyclePosition: number;
    season: "Spring" | "Summer" | "Fall" | "Winter" | string;
    modality: "Cardinal" | "Fixed" | "Mutable" | string;
    modalitySegment?: string;
    degreesIntoModality: number; // 0..30
    boundariesLongitude: Record<string, number>; // deg0..deg360
  };
  transit?: {
    sunLon: number;
  };
  natal?: {
    ascendant: number;
    mc: number;
  };
};

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function degNorm(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
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

  return { res, data: data as AscYearResponse };
}

function seasonTheme(season: string | null) {
  const s = (season ?? "").toLowerCase();
  if (s.includes("spring"))
    return {
      chip: "bg-[#6f8b55]",
      chipGlow: "shadow-[0_0_24px_rgba(111,139,85,0.35)]",
      title: "text-[#e9f1dd]",
      sub: "text-[#b9c7a7]",
      ring: "#6f8b55",
    };
  if (s.includes("summer"))
    return {
      chip: "bg-[#b07a3a]",
      chipGlow: "shadow-[0_0_24px_rgba(176,122,58,0.35)]",
      title: "text-[#f3eadf]",
      sub: "text-[#d4c0a7]",
      ring: "#b07a3a",
    };
  if (s.includes("fall") || s.includes("autumn"))
    return {
      chip: "bg-[#8a4b2a]",
      chipGlow: "shadow-[0_0_24px_rgba(138,75,42,0.35)]",
      title: "text-[#f1e3d7]",
      sub: "text-[#d2b8a5]",
      ring: "#8a4b2a",
    };
  if (s.includes("winter"))
    return {
      chip: "bg-[#4b6a6a]",
      chipGlow: "shadow-[0_0_24px_rgba(75,106,106,0.35)]",
      title: "text-[#e3f0ef]",
      sub: "text-[#b6c9c7]",
      ring: "#4b6a6a",
    };
  return {
    chip: "bg-[#6b6b6b]",
    chipGlow: "shadow-[0_0_24px_rgba(107,107,107,0.25)]",
    title: "text-[#efe6d8]",
    sub: "text-[#b9a88f]",
    ring: "#6b6b6b",
  };
}

function SeasonWheel({
  cyclePositionDeg,
  ringColor,
}: {
  cyclePositionDeg: number | null;
  ringColor: string;
}) {
  const cx = 90;
  const cy = 90;
  const r = 68;

  const pos = typeof cyclePositionDeg === "number" ? degNorm(cyclePositionDeg) : 0;
  const angle = -90 + (pos / 360) * 360;
  const rad = (Math.PI / 180) * angle;

  const x2 = cx + r * Math.cos(rad);
  const y2 = cy + r * Math.sin(rad);

  return (
    <div className="rounded-2xl border border-[#2a241d] bg-[#0f0d0a] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
          Cycle wheel
        </div>
        <div
          className="text-[12px] text-[#9e8e79]"
          style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
        >
          {typeof cyclePositionDeg === "number" ? `${pos.toFixed(2)}°` : "—"}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a241d" strokeWidth="12" />

          {/* quadrants */}
          <path d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`} fill="#13100c" opacity="0.9" />
          <path d={`M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`} fill="#0f0d0a" opacity="0.9" />
          <path d={`M ${cx} ${cy} L ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z`} fill="#13100c" opacity="0.9" />
          <path d={`M ${cx} ${cy} L ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`} fill="#0f0d0a" opacity="0.9" />

          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth="12"
            strokeDasharray="2 12"
            opacity="0.35"
          />

          {/* crosshair */}
          <line x1={cx} y1={cy - r - 8} x2={cx} y2={cy + r + 8} stroke="#2a241d" strokeWidth="1" opacity="0.9" />
          <line x1={cx - r - 8} y1={cy} x2={cx + r + 8} y2={cy} stroke="#2a241d" strokeWidth="1" opacity="0.9" />

          {/* abbreviated labels */}
          <text x={cx} y={cy - r - 14} textAnchor="middle" fontSize="10" fill="#b9a88f" letterSpacing="2">
            SPR
          </text>
          <text x={cx + r + 18} y={cy + 3} textAnchor="middle" fontSize="10" fill="#b9a88f" letterSpacing="2">
            SMR
          </text>
          <text x={cx} y={cy + r + 26} textAnchor="middle" fontSize="10" fill="#b9a88f" letterSpacing="2">
            FAL
          </text>
          <text x={cx - r - 18} y={cy + 3} textAnchor="middle" fontSize="10" fill="#b9a88f" letterSpacing="2">
            WTR
          </text>

          {/* hand */}
          <circle cx={cx} cy={cy} r="3.5" fill={ringColor} />
          <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={ringColor} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx={x2} cy={y2} r="3" fill={ringColor} opacity="0.9" />
        </svg>
      </div>

      <div className="mt-3 text-[11px] text-[#8f7f6a]">
        0° starts at your natal ASC; the hand moves with the transiting Sun.
      </div>
    </div>
  );
}

function Meter({ value01 }: { value01: number }) {
  const pct = Math.round(clamp01(value01) * 100);
  return (
    <div className="rounded-2xl border border-[#2a241d] bg-[#0f0d0a] p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
          30° boundary
        </div>
        <div
          className="text-[12px] text-[#9e8e79]"
          style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
        >
          {pct}%
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-[#1a1510] overflow-hidden">
        <div className="h-2 rounded-full bg-[#c2a06f]" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 text-[11px] text-[#8f7f6a]">
        Progress through the current modality segment (0–30°).
      </div>
    </div>
  );
}

function MiniCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-[#2a241d] bg-[#0b0906] p-4">
      <div className="text-[11px] text-[#b9a88f]">{label}</div>
      <div
        className="mt-1 text-[18px] text-[#efe6d8]"
        style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
      >
        {value}
      </div>
      <div className="mt-2 text-[11px] text-[#8f7f6a]">{note}</div>
    </div>
  );
}

export default function SeasonsPage() {
  const [payloadOut, setPayloadOut] = useState<string>("");
  const [data, setData] = useState<AscYearResponse | null>(null);
  const [errorOut, setErrorOut] = useState<string>("");
  const [statusLine, setStatusLine] = useState<string>("");

  const season = data?.ascYear?.season ?? null;
  const modality = data?.ascYear?.modality ?? null;

  const cyclePosition =
    typeof data?.ascYear?.cyclePosition === "number" ? data!.ascYear!.cyclePosition : null;

  const degreesIntoModality =
    typeof data?.ascYear?.degreesIntoModality === "number" ? data!.ascYear!.degreesIntoModality : null;

  const progress01 = useMemo(() => {
    if (typeof degreesIntoModality !== "number") return 0;
    return clamp01(degreesIntoModality / 30);
  }, [degreesIntoModality]);

  const theme = useMemo(() => seasonTheme(season), [season]);

  async function handleGenerate(payloadText: AstroPayloadText) {
    setPayloadOut(payloadText);
    setData(null);
    setErrorOut("");
    setStatusLine("Computing seasons…");

    const out = await postText("/api/asc-year", payloadText);

    if (!out.res.ok || out.data?.ok === false) {
      setStatusLine("");
      setErrorOut(
        `ERROR\n${pretty({
          status: out.res.status,
          error: out.data?.error ?? "Unknown error",
          response: out.data,
        })}`
      );
      return;
    }

    setData(out.data);
    setStatusLine("");
  }

  return (
    <div className="min-h-[100svh] bg-[#0b0906] text-[#efe6d8] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl space-y-5">
        <div className="rounded-2xl border border-[#2a241d] bg-gradient-to-b from-[#0f0d0a] to-[#0b0906] p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
                URA • Seasons
              </div>

              <div className={`mt-2 text-[34px] leading-[1.05] font-semibold ${theme.title}`}>
                {season ?? "—"}{" "}
                <span className={`font-normal ${theme.sub}`}>• {modality ?? "—"}</span>
              </div>

              <div className="mt-2 text-[13px] text-[#b9a88f] max-w-xl">
                Ascendant Year Cycle: anchored to natal ASC, moved by the transiting Sun.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${theme.chip} ${theme.chipGlow}`} />
              <div className="text-[12px] text-[#b9a88f]">
                Earth-tone palette keyed to the current season
              </div>
            </div>
          </div>

          {statusLine ? <div className="mt-4 text-[12px] text-[#c7b9a6]">{statusLine}</div> : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <AstroInputForm
              title="URA • Input"
              defaultAsOfToToday
              initial={{
                birthDate: "1990-01-24",
                birthTime: "01:39",
                timeZone: "America/New_York",
                birthCityState: "Danville, VA",
                lat: 36.585,
                lon: -79.395,
              }}
              onGenerate={handleGenerate}
            />

            <div className="rounded-2xl border border-[#2a241d] bg-[#0f0d0a] p-4">
              <div className="text-[12px] text-[#c7b9a6] mb-2">Payload (text/plain)</div>
              <pre
                className="text-[12px] leading-5 whitespace-pre-wrap break-words text-[#d9cfbf]"
                style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
              >
                {payloadOut || "Generate to view the request payload."}
              </pre>
            </div>

            {errorOut ? (
              <div className="rounded-2xl border border-[#3a251d] bg-[#120b08] p-4">
                <div className="text-[12px] text-[#d7b8a5] mb-2">Error</div>
                <pre
                  className="text-[12px] leading-5 whitespace-pre-wrap break-words text-[#f1e3d7]"
                  style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                >
                  {errorOut}
                </pre>
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SeasonWheel cyclePositionDeg={cyclePosition} ringColor={theme.ring} />
              <Meter value01={progress01} />
            </div>

            <div className="rounded-2xl border border-[#2a241d] bg-[#0f0d0a] p-6">
              <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
                Details
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <MiniCard
                  label="Cycle position"
                  value={
                    typeof data?.ascYear?.cyclePosition === "number"
                      ? `${degNorm(data.ascYear.cyclePosition).toFixed(2)}°`
                      : "—"
                  }
                  note="Sun from ASC (0–360)."
                />

                <MiniCard
                  label="Degrees into modality"
                  value={
                    typeof data?.ascYear?.degreesIntoModality === "number"
                      ? `${data.ascYear.degreesIntoModality.toFixed(2)}°`
                      : "—"
                  }
                  note="0–30 inside the current modality segment."
                />

                <MiniCard
                  label="Natal ASC (anchor)"
                  value={
                    typeof data?.ascYear?.anchorAsc === "number"
                      ? `${degNorm(data.ascYear.anchorAsc).toFixed(2)}°`
                      : "—"
                  }
                  note="The fixed reference point for the year cycle."
                />

                <MiniCard
                  label="Transiting Sun (mover)"
                  value={
                    typeof data?.transit?.sunLon === "number"
                      ? `${degNorm(data.transit.sunLon).toFixed(2)}°`
                      : "—"
                  }
                  note="Sun longitude used for the motion."
                />
              </div>

              <details className="mt-5">
                <summary className="text-[12px] text-[#b9a88f] cursor-pointer select-none">
                  30° boundaries (longitudes)
                </summary>

                <div className="mt-3 rounded-xl border border-[#2a241d] bg-[#0b0906] p-4">
                  <div className="text-[11px] text-[#8f7f6a] mb-2">
                    Boundaries are anchored to natal ASC in 30° steps.
                  </div>

                  <pre
                    className="text-[12px] leading-5 whitespace-pre-wrap break-words text-[#d9cfbf]"
                    style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                  >
                    {data?.ascYear?.boundariesLongitude
                      ? Object.entries(data.ascYear.boundariesLongitude)
                          .map(([k, v]) => `${k}: ${degNorm(v).toFixed(2)}°`)
                          .join("\n")
                      : "—"}
                  </pre>
                </div>
              </details>

              <details className="mt-4">
                <summary className="text-[12px] text-[#b9a88f] cursor-pointer select-none">
                  Raw response (debug)
                </summary>
                <pre
                  className="mt-3 rounded-xl border border-[#2a241d] bg-[#0b0906] p-4 text-[12px] leading-5 whitespace-pre-wrap break-words text-[#d9cfbf]"
                  style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                >
                  {data ? pretty(data) : "No data yet."}
                </pre>
              </details>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-[#8f7f6a] px-1">
          /seasons is a presentation layer over /api/asc-year (12×30° model).
        </div>
      </div>
    </div>
  );
}
