"use client";

import { useEffect, useMemo, useState } from "react";
import PhaseMicrocopyCard from "@/components/PhaseMicrocopyCard";
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";

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
    moonPos: string;
    moonSign: string;
    moonEntersSign: string;
    moonEntersLocal: string;
  };

  lunation: { markers: Marker[] };
};

const C = {
  ink: "#1F241A",
  inkMuted: "rgba(31,36,26,0.72)",
  inkSoft: "rgba(31,36,26,0.55)",
  surface: "rgba(244,235,221,0.88)",
  border: "rgba(31,36,26,0.16)",
  divider: "rgba(31,36,26,0.14)",
  linen: "#D5C0A5",
};

function iconFor(kind: Marker["kind"]) {
  if (kind === "New Moon") return "◯";
  if (kind === "First Quarter") return "◐";
  if (kind === "Full Moon") return "●";
  return "◑";
}

/* ───────────────────────── Moon Disc (FULL FIXED) ───────────────────────── */

function MoonDisc({
  phaseName,
  phaseAngleDeg,
}: {
  phaseName: string;
  phaseAngleDeg?: number;
}) {
  const a = typeof phaseAngleDeg === "number" ? phaseAngleDeg : 180;
  const rad = (a * Math.PI) / 180;

  // illumination: 0 = New, 1 = Full
  const illum = (1 - Math.cos(rad)) / 2;
  const shadowOpacity = Math.max(0, Math.min(1, 1 - illum));

  const r = 92;
  const k = Math.cos(rad);
  const dxMag = r * (1 - k);
  const waxing = a >= 0 && a <= 180;
  const dx = waxing ? -dxMag : dxMag;

  return (
    <div className="relative mx-auto w-[220px] h-[220px]">
      <svg viewBox="0 0 220 220" className="w-full h-full">
        <defs>
          <radialGradient id="moonSurface" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F7F0E4" />
            <stop offset="55%" stopColor="#E7D7C2" />
            <stop offset="100%" stopColor={C.linen} />
          </radialGradient>

          <radialGradient id="moonShadow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(31,36,26,0.55)" />
            <stop offset="100%" stopColor="rgba(31,36,26,0.88)" />
          </radialGradient>

          <clipPath id="moonClip">
            <circle cx="110" cy="110" r="100" />
          </clipPath>
        </defs>

        <circle
          cx="110"
          cy="110"
          r="108"
          fill="rgba(244,235,221,0.55)"
          stroke={C.border}
          strokeWidth="2"
        />

        <g clipPath="url(#moonClip)">
          <circle cx="110" cy="110" r={r} fill="url(#moonSurface)" />

          {/* Shadow fades out completely at Full */}
          <g opacity={shadowOpacity}>
            <circle cx={110 + dx} cy="110" r={r} fill="url(#moonShadow)" />
          </g>
        </g>

        <circle
          cx="110"
          cy="110"
          r="100"
          fill="none"
          stroke={C.border}
          strokeWidth="1.5"
        />
      </svg>

      <div className="sr-only">{phaseName}</div>
    </div>
  );
}

/* ───────────────────────── Calendar Client ───────────────────────── */

export default function CalendarClient() {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<CalendarAPI | null>(null);

  async function load(targetYmd?: string) {
    const url = targetYmd ? `/api/calendar?ymd=${targetYmd}` : "/api/calendar";
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as CalendarAPI;
    setData(json);
    setYmd(json.gregorian.ymd);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function nav(delta: number) {
    if (!ymd) return;
    const d = new Date(ymd + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + delta);
    load(d.toISOString().slice(0, 10)).catch(() => {});
  }

  const phaseCopy = useMemo(() => {
    const p = data?.solar?.phase;
    return microcopyForPhase(
      typeof p === "number" && p >= 1 && p <= 8 ? (p as PhaseId) : 1
    );
  }, [data?.solar?.phase]);

  const lunarLabelHuman = useMemo(() => {
    return (data?.lunar?.label ?? "")
      .replace(/\bLC-?(\d+)\b/g, "Full Lunar Cycle $1")
      .replace(/\bLD-?(\d+)\b/g, "Lunar Day $1");
  }, [data?.lunar?.label]);

  return (
    <div className="space-y-5">
      <div
        className="rounded-3xl border px-6 py-7 text-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(244,235,221,0.92), rgba(213,192,165,0.82))",
          borderColor: C.border,
        }}
      >
        <div className="text-sm tracking-widest" style={{ color: C.inkSoft }}>
          CURRENT
        </div>

        <MoonDisc
          phaseName={data?.lunar.phaseName ?? "—"}
          phaseAngleDeg={data?.lunar.phaseAngleDeg}
        />

        <div className="mt-3 text-4xl font-semibold" style={{ color: C.ink }}>
          {data?.lunar.phaseName ?? "—"}
        </div>

        {/* Moon sign block */}
        <div className="mt-4 flex justify-center">
          <div
            className="rounded-2xl border px-5 py-4"
            style={{ background: C.surface, borderColor: C.border }}
          >
            <div style={{ color: C.ink }}>
              The Moon is in <strong>{data?.astro.moonSign ?? "—"}</strong>
            </div>
            <div className="text-sm" style={{ color: C.inkMuted }}>
              As of {data?.gregorian.asOfLocal ?? "—"}
            </div>
            <div className="text-sm" style={{ color: C.inkMuted }}>
              Enters {data?.astro.moonEntersSign ?? "—"}{" "}
              {data?.astro.moonEntersLocal ?? "—"}
            </div>
          </div>
        </div>

        {/* Context Panels */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="rounded-2xl border px-5 py-4" style={{ background: C.surface }}>
            <div className="text-xs tracking-widest font-bold">
              SOLAR CONTEXT ☉
            </div>
            <div className="mt-2 text-sm">
              Phase {data?.solar.phase} of 8 • Day {data?.solar.dayInPhase} of 45
            </div>
            <div className="mt-1 text-xs" style={{ color: C.inkMuted }}>
              Day {data?.solar.dayIndexInYear} /{" "}
              {(data?.solar.yearLength ?? 0) - 1}
            </div>
          </div>

          <div className="rounded-2xl border px-5 py-4" style={{ background: C.surface }}>
            <div className="text-xs tracking-widest font-bold">
              LUNAR CONTEXT ☾
            </div>
            <div className="mt-2 text-sm">{lunarLabelHuman}</div>
            <div className="mt-1 text-xs" style={{ color: C.inkMuted }}>
              Age {data?.lunar.lunarAgeDays?.toFixed(2)} days • Lunar Day{" "}
              {data?.lunar.lunarDay}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <PhaseMicrocopyCard copy={phaseCopy} tone="linen" />
        </div>

        <div className="mt-6 flex justify-between">
          <button onClick={() => nav(-1)}>◀</button>
          <button onClick={() => load()}>● Today</button>
          <button onClick={() => nav(1)}>▶</button>
        </div>
      </div>
    </div>
  );
}
