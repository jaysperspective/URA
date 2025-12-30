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

// --- New palette from reference (+ optional brown) ---
const C = {
  wheat: "#B9B07B", // warm wheat
  olive: "#71744F", // deep olive
  linen: "#D5C0A5", // soft linen
  brown: "#6B4F3A", // optional warm brown for contrast
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
  const a = typeof phaseAngleDeg === "number" ? phaseAngleDeg : 180;

  // 0 = New, 180 = Full
  const rad = (a * Math.PI) / 180;
  const k = Math.cos(rad); // 1 at New, -1 at Full

  const r = 92;
  const dxMag = r * (1 - k);

  const waxing = a >= 0 && a <= 180;
  const dx = waxing ? -dxMag : dxMag;

  return (
    <div className="relative mx-auto w-[220px] h-[220px]">
      <svg viewBox="0 0 220 220" className="w-full h-full">
        <defs>
          {/* Surface: linen → wheat */}
          <radialGradient id="moonSurface" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F4EBDD" />
            <stop offset="55%" stopColor={C.linen} />
            <stop offset="100%" stopColor={C.wheat} />
          </radialGradient>

          {/* Shadow: olive depth */}
          <radialGradient id="moonShadow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(113,116,79,0.62)" />
            <stop offset="100%" stopColor="rgba(113,116,79,0.92)" />
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

        {/* outer bezel */}
        <circle
          cx="110"
          cy="110"
          r="108"
          fill="rgba(213,192,165,0.55)"
          stroke="rgba(113,116,79,0.30)"
          strokeWidth="2"
        />

        <g clipPath="url(#moonClip)" filter="url(#softGlow)">
          <circle cx="110" cy="110" r={r} fill="url(#moonSurface)" />

          {/* subtle “crater” speckle in warm brown */}
          <g opacity="0.16">
            <circle cx="78" cy="88" r="10" fill="rgba(107,79,58,0.28)" />
            <circle cx="145" cy="78" r="7" fill="rgba(107,79,58,0.22)" />
            <circle cx="125" cy="135" r="12" fill="rgba(107,79,58,0.20)" />
            <circle cx="92" cy="140" r="6" fill="rgba(107,79,58,0.22)" />
            <circle cx="160" cy="120" r="5" fill="rgba(107,79,58,0.22)" />
          </g>

          {/* shadow disc creates phase */}
          <circle cx={110 + dx} cy="110" r={r} fill="url(#moonShadow)" />

          {/* soft terminator */}
          <circle
            cx={110 + dx * 0.92}
            cy="110"
            r={r}
            fill="rgba(107,79,58,0.08)"
          />
        </g>

        {/* inner rim */}
        <circle
          cx="110"
          cy="110"
          r="100"
          fill="none"
          stroke="rgba(113,116,79,0.30)"
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
        <div style={{ color: C.olive }} className="opacity-80">
          {icon}
        </div>
        <div style={{ color: C.olive }} className="text-sm font-medium">
          {left}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div style={{ color: C.brown }} className="text-sm opacity-90">
          {right}
        </div>
        <div style={{ color: C.olive }} className="opacity-35">
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
    background:
      "linear-gradient(180deg, rgba(213,192,165,0.86) 0%, rgba(185,176,123,0.52) 60%, rgba(113,116,79,0.28) 120%)",
    borderColor: "rgba(113,116,79,0.28)",
    boxShadow:
      "0 26px 90px rgba(113,116,79,0.18), 0 2px 0 rgba(255,255,255,0.28) inset",
  };

  const panelStyle: React.CSSProperties = {
    background: "rgba(213,192,165,0.70)",
    borderColor: "rgba(113,116,79,0.26)",
  };

  return (
    <div className="space-y-5">
      {/* HERO */}
      <div className="rounded-3xl border px-6 py-7 text-center" style={cardStyle}>
        <div
          className="text-sm tracking-widest"
          style={{ color: C.olive, opacity: 0.85 }}
        >
          {header.top}
        </div>

        <div
          className="text-4xl font-semibold tracking-tight mt-2"
          style={{ color: C.olive }}
        >
          {header.mid}
        </div>

        {/* SOLAR + LUNAR PANELS */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Solar */}
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest"
              style={{ color: C.olive, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              SOLAR CONTEXT
            </div>

            {data?.solar?.kind === "INTERPHASE" ? (
              <div className="mt-2 text-sm" style={{ color: C.olive }}>
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
              <div className="mt-2 text-sm" style={{ color: C.olive }}>
                Phase{" "}
                <span className="font-semibold">{data?.solar?.phase ?? "—"}</span>{" "}
                of 8 • Day{" "}
                <span className="font-semibold">
                  {data?.solar?.dayInPhase ?? "—"}
                </span>{" "}
                of 45
              </div>
            )}

            <div className="mt-2 text-xs" style={{ color: C.brown, opacity: 0.9 }}>
              Day index: {data?.solar?.dayIndexInYear ?? "—"} /{" "}
              {typeof data?.solar?.yearLength === "number"
                ? data.solar.yearLength - 1
                : "—"}
            </div>

            <div
              className="mt-3 w-full h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(113,116,79,0.20)" }}
            >
              <div
                className="h-full"
                style={{
                  background: C.olive,
                  opacity: 0.65,
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

            <div className="mt-2 text-xs" style={{ color: C.brown, opacity: 0.85 }}>
              Anchor: {data?.solar?.anchors?.equinoxLocalDay ?? "—"} → Next:{" "}
              {data?.solar?.anchors?.nextEquinoxLocalDay ?? "—"}
            </div>
          </div>

          {/* Lunar */}
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest"
              style={{ color: C.olive, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              LUNAR CONTEXT
            </div>

            <div className="mt-2 text-sm" style={{ color: C.olive }}>
              {data?.lunar?.label ?? "—"}
            </div>

            <div className="mt-2 text-xs" style={{ color: C.brown, opacity: 0.9 }}>
              Age:{" "}
              {typeof data?.lunar?.lunarAgeDays === "number"
                ? `${data.lunar.lunarAgeDays.toFixed(2)} days`
                : "—"}{" "}
              • LD-{data?.lunar?.lunarDay ?? "—"}
            </div>

            <div
              className="mt-3 w-full h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(113,116,79,0.20)" }}
            >
              <div
                className="h-full"
                style={{
                  background: C.olive,
                  opacity: 0.65,
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

            <div className="mt-2 text-xs" style={{ color: C.brown, opacity: 0.85 }}>
              Moon: {data?.astro?.moonPos ?? "—"}
            </div>
          </div>
        </div>

        {/* Moon Disc */}
        <div className="mt-7 flex justify-center">
          <MoonDisc
            phaseName={header.mid}
            phaseAngleDeg={data?.lunar?.phaseAngleDeg}
          />
        </div>

        <div className="mt-6 text-xl" style={{ color: C.olive }}>
          The Moon is in{" "}
          <span style={{ color: C.olive }} className="font-semibold">
            {data?.astro.moonSign ?? "—"}
          </span>
        </div>

        <div className="mt-2 text-sm" style={{ color: C.brown, opacity: 0.9 }}>
          As of{" "}
          <span style={{ color: C.olive, opacity: 0.9 }}>
            {data?.gregorian.asOfLocal ?? "—"}
          </span>
        </div>

        <div className="mt-1 text-sm" style={{ color: C.brown, opacity: 0.9 }}>
          Enters{" "}
          <span style={{ color: C.olive, opacity: 0.9 }}>
            {data?.astro.moonEntersSign ?? "—"}
          </span>{" "}
          <span style={{ color: C.olive, opacity: 0.9 }}>
            {data?.astro.moonEntersLocal ?? "—"}
          </span>
        </div>

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="text-sm px-3 py-2 rounded-full border"
            style={{
              color: C.olive,
              borderColor: "rgba(113,116,79,0.28)",
              background: "rgba(213,192,165,0.60)",
            }}
          >
            ◀
          </button>

          <button
            onClick={() => load()}
            className="text-sm px-4 py-2 rounded-full border"
            style={{
              color: C.olive,
              borderColor: "rgba(113,116,79,0.28)",
              background: "rgba(213,192,165,0.60)",
            }}
          >
            ● Today
          </button>

          <button
            onClick={() => nav(1)}
            className="text-sm px-3 py-2 rounded-full border"
            style={{
              color: C.olive,
              borderColor: "rgba(113,116,79,0.28)",
              background: "rgba(213,192,165,0.60)",
            }}
          >
            ▶
          </button>
        </div>

        <div className="mt-5 text-xs" style={{ color: C.brown, opacity: 0.85 }}>
          {loading ? "…" : data?.solar.label ?? ""}
          <span style={{ color: C.olive, opacity: 0.35 }}> • </span>
          {data?.lunar.label ?? ""}
        </div>
      </div>

      {/* Moon phase cycle */}
      <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
        <div
          className="text-xs tracking-widest text-center"
          style={{ color: C.olive, fontWeight: 800, letterSpacing: "0.16em" }}
        >
          MOON PHASE CYCLE
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {(data?.lunation.markers ?? []).map((m) => (
            <div key={m.kind} className="space-y-2">
              <div style={{ color: C.olive }} className="text-2xl opacity-80">
                {iconFor(m.kind)}
              </div>
              <div style={{ color: C.brown, opacity: 0.9 }} className="text-xs">
                {m.kind}
              </div>
              <div style={{ color: C.olive }} className="text-sm font-semibold">
                {m.degreeText}
              </div>
              <div style={{ color: C.brown, opacity: 0.85 }} className="text-xs">
                {m.whenLocal}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom rows (solar-forward) */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          ...panelStyle,
          boxShadow: "0 10px 40px rgba(113,116,79,0.10)",
        }}
      >
        <div style={{ borderBottom: "1px solid rgba(113,116,79,0.16)" }}>
          <Row left="Current Calendar" right={data?.solar.label ?? "—"} icon="⟐" />
        </div>

        <div style={{ borderBottom: "1px solid rgba(113,116,79,0.16)" }}>
          <Row left="Sun" right={data?.astro.sunPos ?? "—"} icon="☉" />
        </div>

        <div style={{ borderBottom: "1px solid rgba(113,116,79,0.16)" }}>
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
