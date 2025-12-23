// src/app/seasons/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AstroInputForm, { type AstroPayloadText } from "@/components/astro/AstroInputForm";

const LS_PAYLOAD_KEY = "ura:lastPayloadText";

// -----------------------------
// Types (Core API)
// -----------------------------

type CoreBody = { lon?: number | null; lat?: number | null; speed?: number | null };
type CoreChart = {
  jd_ut?: number;
  ascendant?: number | null;
  mc?: number | null;
  houses?: number[] | null;
  bodies?: Record<string, CoreBody | number | null | undefined> | null;
};

type CoreSummary = {
  ascYearLabel?: string;
  ascYearCyclePos?: number;
  ascYearDegreesInto?: number;
  lunationLabel?: string;
  lunationSeparation?: number;
  natal?: { asc?: number; ascSign?: string; mc?: number; mcSign?: string };
  asOf?: { sun?: number; sunSign?: string };
};

type CoreAscYear = {
  anchorAsc: number;
  cyclePosition: number;
  season: "Spring" | "Summer" | "Fall" | "Winter" | string;
  modality: "Cardinal" | "Fixed" | "Mutable" | string;
  modalitySegment?: string;
  degreesIntoModality: number; // 0..30
  boundariesLongitude: Record<string, number>; // deg0..deg360
};

type CoreResponse = {
  ok: boolean;
  error?: string;
  input?: any;
  birthUTC?: string;
  asOfUTC?: string;
  natal?: CoreChart;
  asOf?: CoreChart;
  derived?: {
    ascYear?: CoreAscYear;
    lunation?: any;
    summary?: CoreSummary;
  };
  text?: string;
};

type AstroFormInitial = {
  birthDate?: string;
  birthTime?: string;
  timeZone?: string;
  birthCityState?: string;
  lat?: number;
  lon?: number;
  asOfDate?: string;
  resolvedLabel?: string;
};

// -----------------------------
// Utility
// -----------------------------

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

  return { res, data };
}

/**
 * Best-effort parse of the canonical payload text into initial form fields.
 * Keeps /seasons unified with /input by rehydrating the last saved payload.
 */
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

// -----------------------------
// Zodiac formatting helpers
// -----------------------------

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
  return {
    glyph,
    sign: p.sign,
    text: `${glyph} ${p.deg}°${mm}′`,
    raw: `${degNorm(lon).toFixed(2)}°`,
  };
}

// -----------------------------
// Asc-year helpers
// -----------------------------

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

function safeParseAsOfDateFromPayload(payloadText: string): Date | null {
  const m = payloadText.match(/^\s*as_of_date:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  if (!m) return null;
  const [y, mo, d] = m[1].split("-").map((x) => Number(x));
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d, 12, 0, 0);
}

function addDays(d: Date, days: number) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + days);
  return x;
}

function fmtDateShort(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = d.getFullYear();
  return `${mm}/${dd}/${yy}`;
}

function computeNextSegment(nowSeason: string | null, nowModality: string | null) {
  const seasons = ["Spring", "Summer", "Fall", "Winter"] as const;
  const modalities = ["Cardinal", "Fixed", "Mutable"] as const;

  const sIdx = seasons.indexOf((nowSeason as any) ?? "Spring");
  const mIdx = modalities.indexOf((nowModality as any) ?? "Cardinal");

  const safeS = sIdx >= 0 ? sIdx : 0;
  const safeM = mIdx >= 0 ? mIdx : 0;

  if (safeM < 2) {
    return { season: seasons[safeS], modality: modalities[safeM + 1] };
  }

  const nextSeason = seasons[(safeS + 1) % 4];
  return { season: nextSeason, modality: "Cardinal" as const };
}

// -----------------------------
// Theme
// -----------------------------

function seasonTheme(season: string | null) {
  const s = (season ?? "").toLowerCase();
  if (s.includes("spring"))
    return {
      chip: "bg-[#6f8b55]",
      chipGlow: "shadow-[0_0_24px_rgba(111,139,85,0.35)]",
      title: "text-[#e9f1dd]",
      sub: "text-[#b9c7a7]",
      ring: "#6f8b55",
      accent: "text-[#cfe2b8]",
    };
  if (s.includes("summer"))
    return {
      chip: "bg-[#b07a3a]",
      chipGlow: "shadow-[0_0_24px_rgba(176,122,58,0.35)]",
      title: "text-[#f3eadf]",
      sub: "text-[#d4c0a7]",
      ring: "#b07a3a",
      accent: "text-[#f1d4ad]",
    };
  if (s.includes("fall") || s.includes("autumn"))
    return {
      chip: "bg-[#8a4b2a]",
      chipGlow: "shadow-[0_0_24px_rgba(138,75,42,0.35)]",
      title: "text-[#f1e3d7]",
      sub: "text-[#d2b8a5]",
      ring: "#8a4b2a",
      accent: "text-[#f0c6aa]",
    };
  if (s.includes("winter"))
    return {
      chip: "bg-[#4b6a6a]",
      chipGlow: "shadow-[0_0_24px_rgba(75,106,106,0.35)]",
      title: "text-[#e3f0ef]",
      sub: "text-[#b6c9c7]",
      ring: "#4b6a6a",
      accent: "text-[#cfe7e4]",
    };
  return {
    chip: "bg-[#6b6b6b]",
    chipGlow: "shadow-[0_0_24px_rgba(107,107,107,0.25)]",
    title: "text-[#efe6d8]",
    sub: "text-[#b9a88f]",
    ring: "#6b6b6b",
    accent: "text-[#d9cfbf]",
  };
}

// -----------------------------
// Helpers: reading natal placements robustly
// -----------------------------

function getLonFromPlanetsMap(planets: any, key: string): number | null {
  if (!planets || typeof planets !== "object") return null;

  const v = (planets as any)[key];
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && typeof v.lon === "number") return v.lon;

  const k2 = key.toLowerCase();
  const v2 = (planets as any)[k2];
  if (typeof v2 === "number") return v2;
  if (v2 && typeof v2 === "object" && typeof v2.lon === "number") return v2.lon;

  return null;
}

function pickFirstNumber(obj: any, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "number") return v;
  }
  return null;
}

function resolveNatalLon(natal: any, planetKey: string): number | null {
  if (!natal) return null;

  const viaBodies = getLonFromPlanetsMap(natal.bodies, planetKey);
  if (typeof viaBodies === "number") return viaBodies;

  const direct = pickFirstNumber(natal, [`${planetKey}Lon`, `${planetKey}_lon`, planetKey]);
  if (typeof direct === "number") return direct;

  const viaMap = getLonFromPlanetsMap(natal.planets, planetKey);
  if (typeof viaMap === "number") return viaMap;

  return null;
}

function computeSouthNodeLon(north: number | null, south: number | null): number | null {
  if (typeof south === "number") return south;
  if (typeof north === "number") return degNorm(north + 180);
  return null;
}

// -----------------------------
// UI pieces
// -----------------------------

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
        <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">Cycle wheel</div>
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
          <line
            x1={cx}
            y1={cy - r - 8}
            x2={cx}
            y2={cy + r + 8}
            stroke="#2a241d"
            strokeWidth="1"
            opacity="0.9"
          />
          <line
            x1={cx - r - 8}
            y1={cy}
            x2={cx + r + 8}
            y2={cy}
            stroke="#2a241d"
            strokeWidth="1"
            opacity="0.9"
          />

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
          <line
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke={ringColor}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
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
        <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">30° boundary</div>
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

function NowNextShiftStrip({
  nowSeason,
  nowModality,
  degreesIntoModality,
  payloadText,
  accentClass,
}: {
  nowSeason: string | null;
  nowModality: string | null;
  degreesIntoModality: number | null;
  payloadText: string;
  accentClass: string;
}) {
  const next = useMemo(() => computeNextSegment(nowSeason, nowModality), [nowSeason, nowModality]);

  const remainingDeg = useMemo(() => {
    if (typeof degreesIntoModality !== "number") return null;
    const rem = 30 - degreesIntoModality;
    return rem < 0 ? 0 : rem;
  }, [degreesIntoModality]);

  const shift = useMemo(() => {
    const DEG_PER_DAY = 0.9856;

    if (remainingDeg == null) return { days: null as number | null, date: null as Date | null };

    const days = remainingDeg / DEG_PER_DAY;
    const base = safeParseAsOfDateFromPayload(payloadText) ?? new Date();
    const date = addDays(base, Math.max(0, Math.round(days)));
    return { days, date };
  }, [remainingDeg, payloadText]);

  const nowText = `${nowSeason ?? "—"} • ${nowModality ?? "—"}`;
  const nextText = `${next.season} • ${next.modality}`;

  const shiftDaysText = typeof shift.days === "number" ? `~${shift.days.toFixed(1)} days` : "—";
  const shiftDateText = shift.date ? fmtDateShort(shift.date) : "—";

  return (
    <div className="rounded-2xl border border-[#2a241d] bg-[#0f0d0a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">Orientation</div>
        <div className="text-[11px] text-[#8f7f6a]">Next segment change estimate (Sun motion).</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#201a13] bg-black/20 p-4">
          <div className="text-[11px] text-[#b9a88f]">Now</div>
          <div className={`mt-1 text-[16px] ${accentClass}`}>{nowText}</div>
          <div className="mt-2 text-[11px] text-[#8f7f6a]">Current season + modality.</div>
        </div>

        <div className="rounded-xl border border-[#201a13] bg-black/20 p-4">
          <div className="text-[11px] text-[#b9a88f]">Next</div>
          <div className="mt-1 text-[16px] text-[#efe6d8]">{nextText}</div>
          <div className="mt-2 text-[11px] text-[#8f7f6a]">The next 30° segment.</div>
        </div>

        <div className="rounded-xl border border-[#201a13] bg-black/20 p-4">
          <div className="text-[11px] text-[#b9a88f]">Shift</div>
          <div className="mt-1 text-[16px] text-[#efe6d8]">
            {shiftDaysText}
            <span className="text-[#8f7f6a]"> • </span>
            <span className="text-[#c7b9a6]">{shiftDateText}</span>
          </div>
          <div className="mt-2 text-[11px] text-[#8f7f6a]">
            Based on remaining degrees in this segment.
          </div>
        </div>
      </div>
    </div>
  );
}

function NatalPlacementsTable({ natal }: { natal: CoreChart | null | undefined }) {
  const n: any = natal ?? null;

  const lonASC = typeof n?.ascendant === "number" ? n.ascendant : null;
  const lonMC = typeof n?.mc === "number" ? n.mc : null;

  const lonSun = resolveNatalLon(n, "sun");
  const lonMoon = resolveNatalLon(n, "moon");
  const lonMercury = resolveNatalLon(n, "mercury");
  const lonVenus = resolveNatalLon(n, "venus");
  const lonMars = resolveNatalLon(n, "mars");
  const lonJupiter = resolveNatalLon(n, "jupiter");
  const lonSaturn = resolveNatalLon(n, "saturn");
  const lonUranus = resolveNatalLon(n, "uranus");
  const lonNeptune = resolveNatalLon(n, "neptune");
  const lonPluto = resolveNatalLon(n, "pluto");

  const lonChiron = resolveNatalLon(n, "chiron");

  const lonNorth =
    getLonFromPlanetsMap(n?.bodies, "northNode") ??
    getLonFromPlanetsMap(n?.bodies, "trueNode") ??
    getLonFromPlanetsMap(n?.bodies, "meanNode") ??
    getLonFromPlanetsMap(n?.bodies, "rahu") ??
    null;

  const lonSouthRaw =
    getLonFromPlanetsMap(n?.bodies, "southNode") ??
    getLonFromPlanetsMap(n?.bodies, "ketu") ??
    null;

  const lonSouth = computeSouthNodeLon(lonNorth, lonSouthRaw);

  const rows: Array<{ label: string; lon: number | null }> = [
    { label: "ASC", lon: lonASC },
    { label: "MC", lon: lonMC },
    { label: "Sun", lon: lonSun },
    { label: "Moon", lon: lonMoon },
    { label: "Mercury", lon: lonMercury },
    { label: "Venus", lon: lonVenus },
    { label: "Mars", lon: lonMars },
    { label: "Jupiter", lon: lonJupiter },
    { label: "Saturn", lon: lonSaturn },
    { label: "Uranus", lon: lonUranus },
    { label: "Neptune", lon: lonNeptune },
    { label: "Pluto", lon: lonPluto },
    { label: "Chiron", lon: lonChiron },
    { label: "North Node", lon: lonNorth },
    { label: "South Node", lon: lonSouth },
  ];

  return (
    <div className="rounded-xl border border-[#2a241d] bg-[#0b0906] p-4">
      <div className="text-[11px] text-[#8f7f6a] mb-2">
        Natal placements (zodiac + degree + raw longitude)
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        {rows.map((r) => {
          const lon = r.lon;
          if (typeof lon !== "number") {
            return (
              <div
                key={r.label}
                className="flex items-center justify-between py-2 border-b border-[#201a13] last:border-b-0"
              >
                <div className="text-[12px] text-[#c7b9a6]">{r.label}</div>
                <div className="text-[12px] text-[#8f7f6a]">—</div>
              </div>
            );
          }

          const f = fmtSignLon(lon);
          return (
            <div
              key={r.label}
              className="flex items-center justify-between py-2 border-b border-[#201a13] last:border-b-0"
            >
              <div className="text-[12px] text-[#c7b9a6]">{r.label}</div>
              <div className="flex items-center gap-3">
                <div
                  className="text-[12px] text-[#b9a88f]"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------
// Page
// -----------------------------

export default function SeasonsPage() {
  const [payloadOut, setPayloadOut] = useState<string>("");
  const [core, setCore] = useState<CoreResponse | null>(null);
  const [errorOut, setErrorOut] = useState<string>("");
  const [statusLine, setStatusLine] = useState<string>("");

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

  const initialFromSaved = useMemo<AstroFormInitial>(() => {
    if (!savedPayload) return {};
    return safeParsePayloadTextToInitial(savedPayload);
  }, [savedPayload]);

  const ascYear = core?.derived?.ascYear ?? null;
  const summary = core?.derived?.summary ?? null;

  // Prefer summary for labels (stable + UI-safe)
  const season = summary?.ascYearLabel?.split("·")[0]?.trim() || ascYear?.season || null;
  const modality =
    summary?.ascYearLabel?.includes("·")
      ? summary.ascYearLabel.split("·")[1]?.trim()
      : ascYear?.modality || null;

  const cyclePosition =
    typeof summary?.ascYearCyclePos === "number"
      ? summary.ascYearCyclePos
      : typeof ascYear?.cyclePosition === "number"
        ? ascYear.cyclePosition
        : null;

  const degreesIntoModality =
    typeof summary?.ascYearDegreesInto === "number"
      ? summary.ascYearDegreesInto
      : typeof ascYear?.degreesIntoModality === "number"
        ? ascYear.degreesIntoModality
        : null;

  const progress01 = useMemo(() => {
    if (typeof degreesIntoModality !== "number") return 0;
    return clamp01(degreesIntoModality / 30);
  }, [degreesIntoModality]);

  const theme = useMemo(() => seasonTheme(season), [season]);

  const boundariesList = useMemo(() => {
    const b = ascYear?.boundariesLongitude;
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
      const lon = (b as any)[k];
      if (typeof lon !== "number") continue;

      const cyclePos = i === 12 ? 0 : i * 30;
      out.push({
        key: k,
        label: `${i * 30}°`,
        lon,
        season: seasonFromCyclePos(cyclePos),
        modality: modalityFromCyclePos(cyclePos),
      });
    }

    return out;
  }, [ascYear?.boundariesLongitude]);

  const transitingSunLon =
    typeof core?.asOf?.bodies?.sun === "object" && core?.asOf?.bodies?.sun
      ? (core.asOf.bodies.sun as any)?.lon
      : null;

  async function handleGenerate(payloadText: AstroPayloadText) {
    setPayloadOut(payloadText);

    try {
      window.localStorage.setItem(LS_PAYLOAD_KEY, payloadText);
      setSavedPayload(payloadText);
    } catch {
      // ignore
    }

    setCore(null);
    setErrorOut("");
    setStatusLine("Computing seasons…");

    const out = await postText("/api/core", payloadText);

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

    setCore(out.data as CoreResponse);
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

            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-3">
                <Link
                  href="/input"
                  className="rounded-xl border border-[#2a241d] bg-black/20 px-4 py-2 text-[12px] text-[#efe6d8] hover:bg-black/30"
                >
                  Edit input
                </Link>

                <Link
                  href="/lunation"
                  className="rounded-xl border border-[#2a241d] bg-black/20 px-4 py-2 text-[12px] text-[#efe6d8] hover:bg-black/30"
                >
                  Go to /lunation
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${theme.chip} ${theme.chipGlow}`} />
                <div className="text-[12px] text-[#b9a88f]">
                  Earth-tone palette keyed to the current season
                </div>
              </div>
            </div>
          </div>

          {statusLine ? <div className="mt-4 text-[12px] text-[#c7b9a6]">{statusLine}</div> : null}
        </div>

        <NowNextShiftStrip
          nowSeason={season}
          nowModality={modality}
          degreesIntoModality={degreesIntoModality}
          payloadText={payloadOut}
          accentClass={theme.accent}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <AstroInputForm
              title="URA • Input"
              defaultAsOfToToday
              initial={{
                birthDate: initialFromSaved.birthDate ?? "1990-01-24",
                birthTime: initialFromSaved.birthTime ?? "01:39",
                timeZone: initialFromSaved.timeZone ?? "America/New_York",
                birthCityState: initialFromSaved.birthCityState ?? "Danville, VA",
                lat: typeof initialFromSaved.lat === "number" ? initialFromSaved.lat : 36.585,
                lon: typeof initialFromSaved.lon === "number" ? initialFromSaved.lon : -79.395,
                asOfDate: initialFromSaved.asOfDate,
                resolvedLabel: initialFromSaved.resolvedLabel,
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
              <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">Details</div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <MiniCard
                  label="Cycle position"
                  value={typeof cyclePosition === "number" ? `${degNorm(cyclePosition).toFixed(2)}°` : "—"}
                  note="Sun from ASC (0–360)."
                />

                <MiniCard
                  label="Degrees into modality"
                  value={
                    typeof degreesIntoModality === "number"
                      ? `${degreesIntoModality.toFixed(2)}°`
                      : "—"
                  }
                  note="0–30 inside the current modality segment."
                />

                <MiniCard
                  label="Natal ASC (anchor)"
                  value={
                    typeof ascYear?.anchorAsc === "number"
                      ? `${degNorm(ascYear.anchorAsc).toFixed(2)}°`
                      : "—"
                  }
                  note="The fixed reference point for the year cycle."
                />

                <MiniCard
                  label="Transiting Sun (mover)"
                  value={
                    typeof transitingSunLon === "number"
                      ? `${degNorm(transitingSunLon).toFixed(2)}°`
                      : "—"
                  }
                  note="Sun longitude used for the motion."
                />
              </div>

              <div className="mt-7">
                <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
                  Natal dial
                </div>
                <div className="mt-3">
                  <NatalPlacementsTable natal={core?.natal ?? null} />
                </div>
              </div>

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
                              <div className="text-[12px] text-[#b9a88f] w-[56px]">{row.label}</div>
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

              {/* No raw JSON block here — intentionally */}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-[#8f7f6a] px-1">
          /seasons is a presentation layer over <span className="text-[#c7b9a6]">/api/core</span>{" "}
          (12×30° model). Saved payload key:{" "}
          <span className="text-[#c7b9a6]">{LS_PAYLOAD_KEY}</span>
        </div>
      </div>
    </div>
  );
}
