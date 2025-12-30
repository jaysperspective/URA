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
    phaseAngleDeg?: number; // ✅ for shading
  };

  astro: {
    sunPos: string;
    sunLon: number; // ✅ raw 0–360°
    nextSolar: {
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

  const r = 92; // radius in viewBox units
  const dxMag = r * (1 - k);

  // Waxing (0..180): light on RIGHT, shadow covers LEFT (shift shadow LEFT)
  // Waning (180..360): light on LEFT, shadow covers RIGHT (shift shadow RIGHT)
  const waxing = a >= 0 && a <= 180;
  const dx = waxing ? -dxMag : dxMag;

  return (
    <div className="relative mx-auto w-[220px] h-[220px]">
      <svg viewBox="0 0 220 220" className="w-full h-full">
        <defs>
          <radialGradient id="moonSurface" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="55%" stopColor="rgba(230,230,230,0.78)" />
            <stop offset="100%" stopColor="rgba(170,170,170,0.55)" />
          </radialGradient>

          <radialGradient id="moonShadow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.70)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.88)" />
          </radialGradient>

          <clipPath id="moonClip">
            <circle cx="110" cy="110" r="100" />
          </clipPath>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
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
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="2"
        />

        {/* Moon group clipped to disc */}
        <g clipPath="url(#moonClip)" filter="url(#softGlow)">
          {/* illuminated base */}
          <circle cx="110" cy="110" r={r} fill="url(#moonSurface)" />

          {/* subtle crater speckle */}
          <g opacity="0.18">
            <circle cx="78" cy="88" r="10" fill="rgba(0,0,0,0.10)" />
            <circle cx="145" cy="78" r="7" fill="rgba(0,0,0,0.10)" />
            <circle cx="125" cy="135" r="12" fill="rgba(0,0,0,0.10)" />
            <circle cx="92" cy="140" r="6" fill="rgba(0,0,0,0.10)" />
            <circle cx="160" cy="120" r="5" fill="rgba(0,0,0,0.10)" />
          </g>

          {/* Shadow disc creates phase */}
          <circle cx={110 + dx} cy="110" r={r} fill="url(#moonShadow)" />

          {/* soft terminator overlay */}
          <circle
            cx={110 + dx * 0.92}
            cy="110"
            r={r}
            fill="rgba(0,0,0,0.10)"
          />
        </g>

        {/* inner rim */}
        <circle
          cx="110"
          cy="110"
          r="100"
          fill="none"
          stroke="rgba(255,255,255,0.10)"
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
        <div className="text-white/80">{icon}</div>
        <div className="text-white/85 text-sm">{left}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-white/55 text-sm">{right}</div>
        <div className="text-white/25">›</div>
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

  return (
    <div className="space-y-4">
      {/* HERO */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-6 py-7 text-center">
        <div className="text-white/80 text-sm tracking-widest">{header.top}</div>

        <div className="text-white text-4xl font-semibold tracking-tight mt-2">
          {header.mid}
        </div>

        {/* --- Solar + Lunar mini modules (side-by-side) --- */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Solar */}
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-white/60 text-xs tracking-widest">SOLAR CONTEXT</div>

            {data?.solar?.kind === "INTERPHASE" ? (
              <div className="mt-2 text-white/85 text-sm">
                Interphase • Day{" "}
                <span className="font-semibold">{data?.solar?.interphaseDay ?? "—"}</span>{" "}
                of{" "}
                <span className="font-semibold">{data?.solar?.interphaseTotal ?? "—"}</span>
              </div>
            ) : (
              <div className="mt-2 text-white/85 text-sm">
                Phase{" "}
                <span className="font-semibold">{data?.solar?.phase ?? "—"}</span>
                {" "}of 8 • Day{" "}
                <span className="font-semibold">{data?.solar?.dayInPhase ?? "—"}</span>
                {" "}of 45
              </div>
            )}

            <div className="mt-2 text-white/45 text-xs">
              Day index: {data?.solar?.dayIndexInYear ?? "—"} /{" "}
              {typeof data?.solar?.yearLength === "number" ? data.solar.yearLength - 1 : "—"}
            </div>

            <div className="mt-3 w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-white/35"
                style={{
                  width:
                    typeof data?.solar?.dayIndexInYear === "number" &&
                    typeof data?.solar?.yearLength === "number"
                      ? `${Math.round(((data.solar.dayIndexInYear + 1) / data.solar.yearLength) * 100)}%`
                      : "0%",
                }}
              />
            </div>

            <div className="mt-2 text-white/35 text-xs">
              Anchor: {data?.solar?.anchors?.equinoxLocalDay ?? "—"} → Next:{" "}
              {data?.solar?.anchors?.nextEquinoxLocalDay ?? "—"}
            </div>
          </div>

          {/* Lunar */}
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-white/60 text-xs tracking-widest">LUNAR CONTEXT</div>

            <div className="mt-2 text-white/85 text-sm">{data?.lunar?.label ?? "—"}</div>

            <div className="mt-2 text-white/45 text-xs">
              Age:{" "}
              {typeof data?.lunar?.lunarAgeDays === "number"
                ? `${data.lunar.lunarAgeDays.toFixed(2)} days`
                : "—"}{" "}
              • LD-{data?.lunar?.lunarDay ?? "—"}
            </div>

            <div className="mt-3 w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-white/35"
                style={{
                  width:
                    typeof data?.lunar?.lunarAgeDays === "number" &&
                    typeof data?.lunar?.synodicMonthDays === "number"
                      ? `${Math.round((data.lunar.lunarAgeDays / data.lunar.synodicMonthDays) * 100)}%`
                      : "0%",
                }}
              />
            </div>

            <div className="mt-2 text-white/35 text-xs">Moon: {data?.astro?.moonPos ?? "—"}</div>
          </div>
        </div>

        {/* --- Shaded Moon Disc --- */}
        <div className="mt-6 flex justify-center">
          <MoonDisc
            phaseName={header.mid}
            phaseAngleDeg={data?.lunar?.phaseAngleDeg}
          />
        </div>

        <div className="mt-6 text-white/85 text-xl">
          The Moon is in{" "}
          <span className="text-white font-semibold">{data?.astro.moonSign ?? "—"}</span>
        </div>

        <div className="mt-2 text-white/55 text-sm">
          As of <span className="text-white/70">{data?.gregorian.asOfLocal ?? "—"}</span>
        </div>

        <div className="mt-1 text-white/55 text-sm">
          Enters <span className="text-white/70">{data?.astro.moonEntersSign ?? "—"}</span>{" "}
          <span className="text-white/70">{data?.astro.moonEntersLocal ?? "—"}</span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => nav(-1)} className="text-white/75 hover:text-white text-sm">
            ◀
          </button>
          <button onClick={() => load()} className="text-white/75 hover:text-white text-sm">
            ● Today
          </button>
          <button onClick={() => nav(1)} className="text-white/75 hover:text-white text-sm">
            ▶
          </button>
        </div>

        <div className="mt-5 text-white/40 text-xs">
          {loading ? "…" : data?.solar.label ?? ""}
          <span className="text-white/25"> • </span>
          {data?.lunar.label ?? ""}
        </div>
      </div>

      {/* MOON PHASE CYCLE */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4">
        <div className="text-white/60 text-xs tracking-widest text-center">MOON PHASE CYCLE</div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {(data?.lunation.markers ?? []).map((m) => (
            <div key={m.kind} className="space-y-2">
              <div className="text-white text-2xl">{iconFor(m.kind)}</div>
              <div className="text-white/75 text-xs">{m.kind}</div>
              <div className="text-white text-sm font-semibold">{m.degreeText}</div>
              <div className="text-white/55 text-xs">{m.whenLocal}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LIST ROWS (solar-forward, remove redundancy) */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur divide-y divide-white/10">
        <Row left="Current Calendar" right={data?.solar.label ?? "—"} icon="⟐" />

        <Row left="Sun" right={data?.astro.sunPos ?? "—"} icon="☉" />

        <Row
          left="Sun Longitude (0–360°)"
          right={
            typeof data?.astro?.sunLon === "number" ? `${data.astro.sunLon.toFixed(2)}°` : "—"
          }
          icon="⦿"
        />

        <Row
          left="Solar Progress"
          right={
            data?.solar?.kind === "INTERPHASE"
              ? `Interphase Day ${data?.solar?.interphaseDay ?? "—"}`
              : `Phase ${data?.solar?.phase ?? "—"} • Day ${data?.solar?.dayInPhase ?? "—"}`
          }
          icon="⌁"
        />

        <Row
          left="Next Sun Phase Boundary"
          right={
            data?.astro?.nextSolar?.nextPhaseAtLocal
              ? `${data.astro.nextSolar.nextBoundaryDeg}° • ${data.astro.nextSolar.nextPhaseAtLocal}`
              : "—"
          }
          icon="➜"
        />
      </div>
    </div>
  );
}
