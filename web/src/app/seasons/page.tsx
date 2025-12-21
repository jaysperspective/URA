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
    sunLon?: number;
    moonLon?: number;
    houses?: number[];
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

// ---- zodiac formatting helpers ----

const SIGN_NAMES = [
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
] as const;

const SIGN_GLYPHS: Record<(typeof SIGN_NAMES)[number], string> = {
  Aries: "♈︎",
  Taurus: "♉︎",
  Gemini: "♊︎",
  Cancer: "♋︎",
  Leo: "♌︎",
  Virgo: "♍︎",
  Libra: "♎︎",
  Scorpio: "♏︎",
  Sagittarius: "♐︎",
  Capricorn: "♑︎",
  Aquarius: "♒︎",
  Pisces: "♓︎",
};

function lonToSignParts(lon: number) {
  const x = degNorm(lon);
  const signIndex = Math.floor(x / 30);
  const sign = SIGN_NAMES[signIndex] ?? "Aries";
  const within = x - signIndex * 30;
  const deg = Math.floor(within);
  const min = Math.round((within - deg) * 60);
  const minFixed = min === 60 ? 0 : min;
  const degFixed = min === 60 ? deg + 1 : deg;
  return { sign, deg: degFixed, min: minFixed };
}

function fmtSignLon(lon: number) {
  const p = lonToSignParts(lon);
  const glyph = SIGN_GLYPHS[p.sign] ?? "";
  const mm = String(p.min).padStart(2, "0");
  return { glyph, sign: p.sign, text: `${glyph} ${p.deg}°${mm}′`, raw: `${degNorm(lon).toFixed(2)}°` };
}

// ---- asc-year model mapping (UI label layer) ----
function seasonFromCyclePos(pos: number) {
  const p = degNorm(pos);
  if (p < 90) return "Spring";
  if (p < 180) return "Summer";
  if (p < 270) return "Fall";
  return "Winter";
}

function modalityFromCyclePos(pos: number) {
  const p = degNorm(pos);
  const withinSeason = p % 90;
  const idx = Math.floor(withinSeason / 30);
  const mods = ["Cardinal", "Fixed", "Mutable"] as const;
  return mods[idx] ?? "Cardinal";
}

// ---- theme ----
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
        <svg width="180" height="180" viewBox="-20 -20 220 220">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a241d" strokeWidth="12" />

          {/* quadrants */}
          <path
            d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`}
            fill="#13100c"
            opacity="0.9"
          />
          <path
            d={`M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`}
            fill="#0f0d0a"
            opacity="0.9"
          />
          <path
            d={`M ${cx} ${cy} L ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z`}
            fill="#13100c"
            opacity="0.9"
          />
          <path
            d={`M ${cx} ${cy} L ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`}
            fill="#0f0d0a"
            opacity="0.9"
          />

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

          {/* labels */}
          <text
            x={cx}
            y={cy - r - 8}
            textAnchor="middle"
            dominantBaseline="hanging"
            fontSize="10"
            fill="#b9a88f"
            letterSpacing="2"
          >
            SPR
          </text>

          <text
            x={cx + r + 12}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#b9a88f"
            letterSpacing="2"
          >
            SMR
          </text>

          <text
            x={cx}
            y={cy + r + 18}
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fontSize="10"
            fill="#b9a88f"
            letterSpacing="2"
          >
            FAL
          </text>

          <text
            x={cx - r - 12}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#b9a88f"
            letterSpacing="2"
          >
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
        <div className="text-[12px] text-[#9e8e79]" style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}>
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
      <div className="mt-1 text-[18px] text-[#efe6d8]" style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}>
        {value}
      </div>
      <div className="mt-2 text-[11px] text-[#8f7f6a]">{note}</div>
    </div>
  );
}

function ReferenceRow({
  label,
  lon,
}: {
  label: string;
  lon: number | null | undefined;
}) {
  if (typeof lon !== "number") {
    return (
      <div className="flex items-center justify-between py-2 border-b border-[#201a13] last:border-b-0">
        <div className="text-[12px] text-[#c7b9a6]">{label}</div>
        <div className="text-[12px] text-[#8f7f6a]">—</div>
      </div>
    );
  }

  const f = fmtSignLon(lon);
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#201a13] last:border-b-0">
      <div className="text-[12px] text-[#c7b9a6]">{label}</div>
      <div className="flex items-center gap-3">
        <div className="text-[12px] text-[#b9a88f]" style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}>
          {f.text}
        </div>
        <div className="text-[12px] text-[#8f7f6a]" style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}>
          {f.raw}
        </div>
      </div>
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

  const boundariesList = useMemo(() => {
    const b = data?.ascYear?.boundariesLongitude;
    if (!b) return [];
    const out: Array<{
      key: string;
      label: string;
      lon: number;
      season: string;
      modality: string;
    }> = [];

    for (let i = 0; i <= 12; i++) {
      const k = `deg${i * 30}`;
      const lon = b[k];
      if (typeof lon !== "number") continue;

      const cyclePos = i === 12 ? 0 : i * 30; // deg360 is same as 0 in phase labeling
      out.push({
        key: k,
        label: `${i * 30}°`,
        lon,
        season: seasonFromCyclePos(cyclePos),
        modality: modalityFromCyclePos(cyclePos),
      });
    }

    return out;
  }, [data?.ascYear?.boundariesLongitude]);

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

              {/* NEW: Natal Reference */}
              <div className="mt-6">
                <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
                  Natal reference
                </div>
                <div className="mt-3 rounded-xl border border-[#2a241d] bg-[#0b0906] p-4">
                  <div className="text-[11px] text-[#8f7f6a] mb-2">
                    Positions are shown as zodiac sign + degree (and raw longitude).
                  </div>

                  <div className="divide-y divide-[#201a13]">
                    <ReferenceRow label="ASC" lon={data?.natal?.ascendant} />
                    <ReferenceRow label="MC" lon={data?.natal?.mc} />
                    <ReferenceRow label="Sun" lon={data?.natal?.sunLon} />
                    <ReferenceRow label="Moon" lon={data?.natal?.moonLon} />
                  </div>
                </div>
              </div>

              {/* NEW: Boundary table */}
              <div className="mt-6">
                <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
                  Asc-year boundaries (12 × 30°)
                </div>

                <div className="mt-3 rounded-xl border border-[#2a241d] bg-[#0b0906] p-4">
                  <div className="text-[11px] text-[#8f7f6a] mb-3">
                    Boundaries are anchored to your natal ASC (so they may not align with sign boundaries).
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {boundariesList.length ? (
                      boundariesList.map((row) => {
                        const f = fmtSignLon(row.lon);
                        return (
                          <div
                            key={row.key}
                            className="flex items-center justify-between rounded-lg border border-[#201a13] bg-black/20 px-3 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-[12px] text-[#b9a88f] w-[56px]">
                                {row.label}
                              </div>
                              <div
                                className="text-[12px] text-[#efe6d8]"
                                style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                              >
                                {f.text}
                              </div>
                              <div
                                className="text-[12px] text-[#8f7f6a]"
                                style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                              >
                                {f.raw}
                              </div>
                            </div>

                            <div className="text-[12px] text-[#c7b9a6]">
                              {row.season} • {row.modality}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[12px] text-[#8f7f6a]">—</div>
                    )}
                  </div>
                </div>
              </div>

              <details className="mt-5">
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
