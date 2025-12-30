// src/app/calendar/ui/CalendarClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Marker = {
  kind: "New Moon" | "First Quarter" | "Full Moon" | "Last Quarter";
  whenLocal: string;
  degreeText: string;
  isoUTC: string;
};

type CalendarAPI = {
  ok: boolean;
  tz: string;
  gregorian: { ymd: string; asOfLocal: string };

  solar: {
    label: string;
    kind?: "PHASE" | "INTERPHASE";
    phase?: number;
    dayInPhase?: number;
    interphaseDay?: number;
    interphaseTotal?: number;
    dayIndexInYear?: number;
    yearLength?: number;
    anchors?: { equinoxLocalDay: string; nextEquinoxLocalDay: string };
  };

  lunar: {
    phaseName: string;
    label: string;
    lunarDay: number;
    lunarAgeDays?: number;
    synodicMonthDays?: number;
    phaseAngleDeg?: number;
  };

  astro: {
    sunPos: string;
    sunLon: number;
    nextSolar?: {
      nextBoundaryDeg: number;
      nextPhaseAtLocal: string;
      nextPhaseAtUTC: string;
    };
    moonPos: string;
    moonSign: string;
    moonEntersSign: string;
    moonEntersLocal: string;
  };

  lunation: { markers: Marker[] };
};

// --- Palette (from screenshot) ---
const C = {
  tea: "#CFE1B9",
  mint: "#E9F5DB",
  muted: "#B5C99A",
  palm: "#87986A",
  dusty: "#718355",
};

function iconFor(kind: Marker["kind"]) {
  if (kind === "New Moon") return "◯";
  if (kind === "First Quarter") return "◐";
  if (kind === "Full Moon") return "●";
  return "◑";
}

function MoonDisc({
  phaseName,
  phaseAngleDeg,
}: {
  phaseName: string;
  phaseAngleDeg?: number;
}) {
  // Fallback to Full if data not loaded yet
  const a = typeof phaseAngleDeg === "number" ? phaseAngleDeg : 180;

  // 0 = New, 180 = Full
  const rad = (a * Math.PI) / 180;
  const k = Math.cos(rad); // 1 at New, -1 at Full

  const r = 92;
  const dxMag = r * (1 - k);

  // Waxing (0..180): light on RIGHT, shadow covers LEFT (shift shadow LEFT)
  // Waning (180..360): light on LEFT, shadow covers RIGHT (shift shadow RIGHT)
  const waxing = a >= 0 && a <= 180;
  const dx = waxing ? -dxMag : dxMag;

  return (
    <div className="relative mx-auto w-[220px] h-[220px]">
      <svg viewBox="0 0 220 220" className="w-full h-full">
        <defs>
          {/* Surface: minty pearl */}
          <radialGradient id="moonSurfaceMint" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F6FBF0" />
            <stop offset="55%" stopColor="#E9F5DB" />
            <stop offset="100%" stopColor="#CFE1B9" />
          </radialGradient>

          {/* Shadow: dusty olive depth */}
          <radialGradient id="moonShadowOlive" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(113,131,85,0.65)" />
            <stop offset="100%" stopColor="rgba(113,131,85,0.90)" />
          </radialGradient>

          <clipPath id="moonClip">
            <circle cx="110" cy="110" r="100" />
          </clipPath>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer bezel */}
        <circle
          cx="110"
          cy="110"
          r="108"
          fill="rgba(233,245,219,0.55)"
          stroke="rgba(113,131,85,0.25)"
          strokeWidth="2"
        />

        {/* Disc */}
        <g clipPath="url(#moonClip)" filter="url(#softGlow)">
          <circle cx="110" cy="110" r={r} fill="url(#moonSurfaceMint)" />

          {/* subtle crater speckle (olive tone) */}
          <g opacity="0.18">
            <circle cx="78" cy="88" r="10" fill="rgba(113,131,85,0.20)" />
            <circle cx="145" cy="78" r="7" fill="rgba(113,131,85,0.18)" />
            <circle cx="125" cy="135" r="12" fill="rgba(113,131,85,0.16)" />
            <circle cx="92" cy="140" r="6" fill="rgba(113,131,85,0.18)" />
            <circle cx="160" cy="120" r="5" fill="rgba(113,131,85,0.18)" />
          </g>

          {/* Shadow disc creates phase */}
          <circle cx={110 + dx} cy="110" r={r} fill="url(#moonShadowOlive)" />

          {/* soft terminator overlay */}
          <circle
            cx={110 + dx * 0.92}
            cy="110"
            r={r}
            fill="rgba(113,131,85,0.10)"
          />
        </g>

        {/* Inner rim */}
        <circle
          cx="110"
          cy="110"
          r="100"
          fill="none"
          stroke="rgba(113,131,85,0.25)"
          strokeWidth="1.5"
        />
      </svg>

      <div className="sr-only">{phaseName}</div>
    </div>
  );
}

function Row({
  left,
  right,
  icon,
}: {
  left: string;
  right: string;
  icon: string;
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div style={{ color: C.dusty }} className="opacity-80">
          {icon}
        </div>
        <div style={{ color: C.dusty }} className="text-sm font-medium">
          {left}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div style={{ color: C.palm }} className="text-sm">
          {right}
        </div>
        <div style={{ color: C.dusty }} className="opacity-40">
          ›
        </div>
      </div>
    </div>
  );
}

export default function CalendarClient() {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<CalendarAPI | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(targetYmd?: string) {
    setLoading(true);
    try {
      const url = targetYmd
        ? `/api/calendar?ymd=${encodeURIComponent(targetYmd)}`
        : "/api/calendar";
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as CalendarAPI;
      setData(json);
      setYmd(json.gregorian.ymd);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function nav(deltaDays: number) {
    if (!ymd) return;

    const [yy, mm, dd] = ymd.split("-").map(Number);
    const d = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
    d.setUTCDate(d.getUTCDate() + deltaDays);

    const next = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getUTCDate()).padStart(2, "0")}`;

    load(next).catch(() => {});
  }

  const header = useMemo(() => {
    if (!data?.ok) return { top: "CURRENT", mid: "—" };
    return { top: "CURRENT", mid: data.lunar.phaseName };
  }, [data]);

  const cardStyle: React.CSSProperties = {
    background: `linear-gradient(180deg, rgba(233,245,219,0.82) 0%, rgba(233,245,219,0.62) 55%, rgba(207,225,185,0.70) 100%)`,
    borderColor: "rgba(113,131,85,0.22)",
    boxShadow:
      "0 24px 80px rgba(113,131,85,0.18), 0 2px 0 rgba(255,255,255,0.25) inset",
  };

  const panelStyle: React.CSSProperties = {
    background: "rgba(233,245,219,0.72)",
    borderColor: "rgba(113,131,85,0.22)",
  };

  return (
    <div className="space-y-5">
      {/* HERO */}
      <div className="rounded-3xl border px-6 py-7 text-center" style={cardStyle}>
        <div
          className="text-sm tracking-widest"
          style={{ color: C.dusty, opacity: 0.85 }}
        >
          {header.top}
        </div>

        <div
          className="text-4xl font-semibold tracking-tight mt-2"
          style={{ color: C.dusty }}
        >
          {header.mid}
        </div>

        {/* --- Solar + Lunar mini modules (side-by-side) --- */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Solar */}
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest"
              style={{ color: C.palm, fontWeight: 700, letterSpacing: "0.16em" }}
            >
              SOLAR CONTEXT
            </div>

            {data?.solar?.kind === "INTERPHASE" ? (
              <div className="mt-2 text-sm" style={{ color: C.dusty }}>
                Interphase • Day{" "}
                <span className="font-semibold">
                  {data?.solar?.interphaseDay ?? "—"}
                </span>{" "}
                of{" "}
                <span className="font-semibold">
                  {data?.solar?.interphaseTotal ?? "—"}
                </span>
              </div>
            ) : (
              <div className="mt-2 text-sm" style={{ color: C.dusty }}>
                Phase{" "}
                <span className="font-semibold">{data?.solar?.phase ?? "—"}</span>{" "}
                of 8 • Day{" "}
                <span className="font-semibold">
                  {data?.solar?.dayInPhase ?? "—"}
                </span>{" "}
                of 45
              </div>
            )}

            <div className="mt-2 text-xs" style={{ color: C.palm }}>
              Day index: {data?.solar?.dayIndexInYear ?? "—"} /{" "}
              {typeof data?.solar?.yearLength === "number"
                ? data.solar.yearLength - 1
                : "—"}
            </div>

            <div className="mt-3 w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(113,131,85,0.18)" }}>
              <div
                className="h-full"
                style={{
                  background: C.dusty,
                  opacity: 0.6,
                  width:
                    typeof data?.solar?.dayIndexInYear === "number" &&
                    typeof data?.solar?.yearLength === "number"
                      ? `${Math.round(
                          ((data.solar.dayIndexInYear + 1) / data.solar.yearLength) * 100
                        )}%`
                      : "0%",
                }}
              />
            </div>

            <div className="mt-2 text-xs" style={{ color: C.palm, opacity: 0.9 }}>
              Anchor: {data?.solar?.anchors?.equinoxLocalDay ?? "—"} → Next:{" "}
              {data?.solar?.anchors?.nextEquinoxLocalDay ?? "—"}
            </div>
          </div>

          {/* Lunar */}
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest"
              style={{ color: C.palm, fontWeight: 700, letterSpacing: "0.16em" }}
            >
              LUNAR CONTEXT
            </div>

            <div className="mt-2 text-sm" style={{ color: C.dusty }}>
              {data?.lunar?.label ?? "—"}
            </div>

            <div className="mt-2 text-xs" style={{ color: C.palm }}>
              Age:{" "}
              {typeof data?.lunar?.lunarAgeDays === "number"
                ? `${data.lunar.lunarAgeDays.toFixed(2)} days`
                : "—"}{" "}
              • LD-{data?.lunar?.lunarDay ?? "—"}
            </div>

            <div className="mt-3 w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(113,131,85,0.18)" }}>
              <div
                className="h-full"
                style={{
                  background: C.dusty,
                  opacity: 0.6,
                  width:
                    typeof data?.lunar?.lunarAgeDays === "number" &&
                    typeof data?.lunar?.synodicMonthDays === "number"
                      ? `${Math.round(
                          (data.lunar.lunarAgeDays / data.lunar.synodicMonthDays) * 100
                        )}%`
                      : "0%",
                }}
              />
            </div>

            <div className="mt-2 text-xs" style={{ color: C.palm }}>
              Moon: {data?.astro?.moonPos ?? "—"}
            </div>
          </div>
        </div>

        {/* --- Shaded Moon Disc --- */}
        <div className="mt-7 flex justify-center">
          <MoonDisc
            phaseName={header.mid}
            phaseAngleDeg={data?.lunar?.phaseAngleDeg}
          />
        </div>

        <div className="mt-6 text-xl" style={{ color: C.dusty }}>
          The Moon is in{" "}
          <span style={{ color: C.dusty }} className="font-semibold">
            {data?.astro.moonSign ?? "—"}
          </span>
        </div>

        <div className="mt-2 text-sm" style={{ color: C.palm }}>
          As of{" "}
          <span style={{ color: C.dusty, opacity: 0.85 }}>
            {data?.gregorian.asOfLocal ?? "—"}
          </span>
        </div>

        <div className="mt-1 text-sm" style={{ color: C.palm }}>
          Enters{" "}
          <span style={{ color: C.dusty, opacity: 0.85 }}>
            {data?.astro.moonEntersSign ?? "—"}
          </span>{" "}
          <span style={{ color: C.dusty, opacity: 0.85 }}>
            {data?.astro.moonEntersLocal ?? "—"}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="text-sm px-3 py-2 rounded-full border"
            style={{
              color: C.dusty,
              borderColor: "rgba(113,131,85,0.25)",
              background: "rgba(233,245,219,0.55)",
            }}
          >
            ◀
          </button>

          <button
            onClick={() => load()}
            className="text-sm px-4 py-2 rounded-full border"
            style={{
              color: C.dusty,
              borderColor: "rgba(113,131,85,0.25)",
              background: "rgba(233,245,219,0.55)",
            }}
          >
            ● Today
          </button>

          <button
            onClick={() => nav(1)}
            className="text-sm px-3 py-2 rounded-full border"
            style={{
              color: C.dusty,
              borderColor: "rgba(113,131,85,0.25)",
              background: "rgba(233,245,219,0.55)",
            }}
          >
            ▶
          </button>
        </div>

        <div className="mt-5 text-xs" style={{ color: C.palm }}>
          {loading ? "…" : data?.solar.label ?? ""}
          <span style={{ color: C.dusty, opacity: 0.35 }}> • </span>
          {data?.lunar.label ?? ""}
        </div>
      </div>

      {/* MOON PHASE CYCLE */}
      <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
        <div
          className="text-xs tracking-widest text-center"
          style={{ color: C.palm, fontWeight: 700, letterSpacing: "0.16em" }}
        >
          MOON PHASE CYCLE
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {(data?.lunation.markers ?? []).map((m) => (
            <div key={m.kind} className="space-y-2">
              <div style={{ color: C.dusty }} className="text-2xl opacity-80">
                {iconFor(m.kind)}
              </div>
              <div style={{ color: C.palm }} className="text-xs">
                {m.kind}
              </div>
              <div style={{ color: C.dusty }} className="text-sm font-semibold">
                {m.degreeText}
              </div>
              <div style={{ color: C.palm }} className="text-xs">
                {m.whenLocal}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIST ROWS (solar-forward) */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          ...panelStyle,
          boxShadow: "0 10px 40px rgba(113,131,85,0.10)",
        }}
      >
        <div style={{ borderBottom: "1px solid rgba(113,131,85,0.14)" }}>
          <Row left="Current Calendar" right={data?.solar.label ?? "—"} icon="⟐" />
        </div>

        <div style={{ borderBottom: "1px solid rgba(113,131,85,0.14)" }}>
          <Row left="Sun" right={data?.astro.sunPos ?? "—"} icon="☉" />
        </div>

        <div style={{ borderBottom: "1px solid rgba(113,131,85,0.14)" }}>
          <Row
            left="Sun Longitude (0–360°)"
            right={
              typeof data?.astro?.sunLon === "number"
                ? `${data.astro.sunLon.toFixed(2)}°`
                : "—"
            }
            icon="⦿"
          />
        </div>

        <Row
          left="Solar Progress"
          right={
            data?.solar?.kind === "INTERPHASE"
              ? `Interphase Day ${data?.solar?.interphaseDay ?? "—"}`
              : `Phase ${data?.solar?.phase ?? "—"} • Day ${data?.solar?.dayInPhase ?? "—"}`
          }
          icon="⌁"
        />
      </div>
    </div>
  );
}

