// src/app/profile/ui/ProfileClient.tsx
"use client";

import Link from "next/link";
import React, { useMemo } from "react";

function safeNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS = [
  "Ari",
  "Tau",
  "Gem",
  "Can",
  "Leo",
  "Vir",
  "Lib",
  "Sco",
  "Sag",
  "Cap",
  "Aqu",
  "Pis",
] as const;

function signFromLon(lon: number) {
  const idx = Math.floor(norm360(lon) / 30) % 12;
  return SIGNS[idx];
}

function fmtLon(lon: number) {
  const x = norm360(lon);
  const degInSign = x % 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  return `${d}° ${String(m).padStart(2, "0")}'`;
}

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

// solar rate (deg/day) for estimating boundary times
const MEAN_SOLAR_RATE = 0.985647;

function ProgressBar({
  value,
  labelLeft,
  labelRight,
}: {
  value: number; // 0..1
  labelLeft: string;
  labelRight: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-[#102B53]/70">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#102B53]/15 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#50698D]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/80 backdrop-blur",
        "shadow-[0_30px_120px_rgba(0,0,0,0.25)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SubCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/55 px-5 py-4">
      <div className="text-[11px] tracking-[0.18em] uppercase text-[#102B53]/60">
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({
  k,
  v,
}: {
  k: string;
  v: React.ReactNode;
}) {
  return (
    <div className="min-w-[92px]">
      <div className="text-[10px] tracking-[0.18em] uppercase text-white/70">
        {k}
      </div>
      <div className="mt-1 text-sm text-white font-medium">{v}</div>
    </div>
  );
}

/**
 * Dial: 8-phase ring, season quadrants, and a hand that points to cyclePosDeg.
 * 0° is at top (12 o'clock). We rotate so that 0° points up.
 */
function AscYearDial({
  cyclePosDeg,
}: {
  cyclePosDeg: number; // 0..360
}) {
  const size = 260;
  const r = 92;
  const cx = size / 2;
  const cy = size / 2;

  const angle = norm360(cyclePosDeg);

  // Convert degrees (0 at top) to radians (SVG 0 at 3 o'clock).
  const rad = ((angle - 90) * Math.PI) / 180;

  const x2 = cx + r * Math.cos(rad);
  const y2 = cy + r * Math.sin(rad);

  // ticks: 8 major ticks (45°) + 16 minor ticks (22.5°)
  const majorTicks = Array.from({ length: 8 }, (_, i) => i * 45);
  const minorTicks = Array.from({ length: 16 }, (_, i) => i * 22.5);

  const tickLine = (deg: number, major: boolean) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const r1 = major ? r + 18 : r + 14;
    const r2 = major ? r + 28 : r + 20;
    const x1 = cx + r1 * Math.cos(a);
    const y1 = cy + r1 * Math.sin(a);
    const x2t = cx + r2 * Math.cos(a);
    const y2t = cy + r2 * Math.sin(a);
    return { x1, y1, x2: x2t, y2: y2t };
  };

  return (
    <div className="mx-auto relative w-[300px] h-[300px] flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-white/25 blur-[22px]" />
      <div className="relative rounded-full border border-black/10 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,.7)] w-[290px] h-[290px] flex items-center justify-center">
        <svg width={size} height={size} className="block">
          {/* outer ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r + 26}
            fill="none"
            stroke="rgba(16,43,83,0.18)"
            strokeWidth="2"
          />

          {/* season axes (0/90/180/270) */}
          {[0, 90, 180, 270].map((deg) => {
            const a = ((deg - 90) * Math.PI) / 180;
            const x = cx + (r + 10) * Math.cos(a);
            const y = cy + (r + 10) * Math.sin(a);
            const x0 = cx + (r - 10) * Math.cos(a);
            const y0 = cy + (r - 10) * Math.sin(a);
            return (
              <line
                key={deg}
                x1={x0}
                y1={y0}
                x2={x}
                y2={y}
                stroke="rgba(16,43,83,0.25)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {/* ticks */}
          {minorTicks.map((deg) => {
            const t = tickLine(deg, false);
            return (
              <line
                key={`m-${deg}`}
                {...t}
                stroke="rgba(16,43,83,0.20)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          {majorTicks.map((deg) => {
            const t = tickLine(deg, true);
            return (
              <line
                key={`M-${deg}`}
                {...t}
                stroke="rgba(16,43,83,0.30)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}

          {/* inner disc */}
          <defs>
            <radialGradient id="disc" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.65)" />
              <stop offset="100%" stopColor="rgba(16,43,83,0.10)" />
            </radialGradient>
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="url(#disc)"
            stroke="rgba(0,0,0,0.10)"
            strokeWidth="1"
          />

          {/* hand */}
          <line
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="rgba(16,43,83,0.70)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="4.5" fill="rgba(16,43,83,0.75)" />

          {/* tiny dot at tip */}
          <circle cx={x2} cy={y2} r="3.5" fill="rgba(80,105,141,0.95)" />
        </svg>
      </div>
    </div>
  );
}

type Props = {
  name: string;
  locationLine: string;
  timezone: string;
  asOfISO: string | null;

  natalAscLon: number | null;
  natalSunLon: number | null;
  natalMoonLon: number | null;

  movingSunLon: number | null;
  movingMoonLon: number | null;

  cyclePosDeg: number | null; // Sun-from-ASC (0..360)
};

export default function ProfileClient(props: Props) {
  const {
    name,
    locationLine,
    timezone,
    asOfISO,
    natalAscLon,
    natalSunLon,
    natalMoonLon,
    movingSunLon,
    movingMoonLon,
    cyclePosDeg,
  } = props;

  const derived = useMemo(() => {
    const cycle = cyclePosDeg != null ? norm360(cyclePosDeg) : null;

    if (cycle == null) {
      return {
        ok: false as const,
        title: "—",
        subtitle: "Cycle position unavailable.",
        season: null as string | null,
        phaseIndex: null as number | null,
        phaseDeg: null as number | null,
        seasonDeg: null as number | null,
        phaseProgress: 0,
        seasonProgress: 0,
        nextLabel: "—",
        shiftText: "—",
      };
    }

    // 8 phases of 45°
    const phaseIndex = Math.floor(cycle / 45) + 1; // 1..8
    const phaseStart = (phaseIndex - 1) * 45;
    const phaseDeg = cycle - phaseStart; // 0..45

    // 4 seasons of 90° (2 phases each)
    const seasonIndex = Math.floor(cycle / 90); // 0..3
    const season = SEASONS[seasonIndex];
    const seasonStart = seasonIndex * 90;
    const seasonDeg = cycle - seasonStart; // 0..90

    const nextPhase = phaseIndex === 8 ? 1 : phaseIndex + 1;
    const nextBoundary = nextPhase === 1 ? 360 : phaseIndex * 45; // boundary at end of current phase
    const remainingDeg = nextBoundary - cycle; // >0 unless at boundary
    const days = remainingDeg / MEAN_SOLAR_RATE;

    const asOf = asOfISO ? new Date(asOfISO) : new Date();
    const shiftAt = new Date(asOf.getTime() + days * 24 * 60 * 60 * 1000);

    const shiftText = `${days >= 0 ? "~" : ""}${Math.abs(days).toFixed(
      1
    )} days • ${shiftAt.toLocaleString(undefined, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    return {
      ok: true as const,
      season,
      phaseIndex,
      phaseDeg,
      seasonDeg,
      phaseProgress: phaseDeg / 45,
      seasonProgress: seasonDeg / 90,
      title: `${season} · Phase ${phaseIndex}`,
      subtitle: `Degrees into phase: ${phaseDeg.toFixed(2)}° / 45°`,
      nextLabel: `${season} · Phase ${nextPhase}`,
      shiftText,
    };
  }, [cyclePosDeg, asOfISO]);

  const asOfLine = useMemo(() => {
    if (!asOfISO) return timezone;
    const d = new Date(asOfISO);
    return `${timezone} • ${d.toLocaleString(undefined, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [asOfISO, timezone]);

  const natalAsc =
    natalAscLon != null ? `${signFromLon(natalAscLon)} ${fmtLon(natalAscLon)}` : "—";
  const natalSun =
    natalSunLon != null ? `${signFromLon(natalSunLon)} ${fmtLon(natalSunLon)}` : "—";
  const natalMoon =
    natalMoonLon != null ? `${signFromLon(natalMoonLon)} ${fmtLon(natalMoonLon)}` : "—";

  const movingSun =
    movingSunLon != null ? `${signFromLon(movingSunLon)} ${fmtLon(movingSunLon)}` : "—";
  const movingMoon =
    movingMoonLon != null ? `${signFromLon(movingMoonLon)} ${fmtLon(movingMoonLon)}` : "—";

  return (
    <div className="mt-8">
      {/* TOP STRIP: identity + placements (no pills) */}
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            {/* optional avatar placeholder */}
            <div className="mt-1 h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white/60 text-xs">
              +
            </div>

            <div>
              <div className="text-white/90 text-sm">Profile</div>
              <div className="text-white text-lg font-semibold leading-tight">
                {name}
              </div>
              <div className="text-white/70 text-sm">{locationLine}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 justify-end">
            <Chip k="ASC (Natal)" v={natalAsc} />
            <Chip k="Sun (Natal)" v={natalSun} />
            <Chip k="Moon (Natal)" v={natalMoon} />
            <Chip k="Sun (Moving)" v={movingSun} />
            <Chip k="Moon (Moving)" v={movingMoon} />
            <Chip k="Timezone" v={timezone} />
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="mt-8 mx-auto max-w-5xl">
        <CardShell>
          <div className="px-8 pt-10 pb-8">
            <div className="text-center">
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#102B53]/55">
                Current
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-[#102B53]">
                {derived.title}
              </div>
              <div className="mt-2 text-sm text-[#102B53]/70">
                {derived.subtitle}
              </div>
            </div>

            {/* ORIENTATION row */}
            <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
              <SubCard title="Orientation">
                <div className="text-sm font-semibold text-[#102B53]">
                  {derived.ok ? derived.title : "—"}
                </div>
                <div className="mt-1 text-sm text-[#102B53]/70">
                  Anchored to natal ASC; advanced by the transiting Sun.
                </div>
              </SubCard>

              <SubCard title="Next">
                <div className="text-sm font-semibold text-[#102B53]">
                  {derived.ok ? derived.nextLabel : "—"}
                </div>
                <div className="mt-1 text-sm text-[#102B53]/70">
                  The next 45° segment (Phase boundary).
                </div>
              </SubCard>

              <SubCard title="Shift">
                <div className="text-sm font-semibold text-[#102B53]">
                  {derived.ok ? derived.shiftText : "—"}
                </div>
                <div className="mt-1 text-sm text-[#102B53]/70">
                  Estimated boundary crossing (mean solar rate).
                </div>
              </SubCard>
            </div>

            {/* PROGRESS bars */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/10 bg-white/55 px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#102B53]/60">
                  45° Phase Boundary
                </div>
                <div className="mt-2 text-sm text-[#102B53]/70">
                  Progress within the current phase (0–45°).
                </div>
                <ProgressBar
                  value={derived.phaseProgress}
                  labelLeft={derived.ok ? `${derived.phaseDeg?.toFixed(2)}°` : "—"}
                  labelRight="45°"
                />
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/55 px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#102B53]/60">
                  90° Season Arc
                </div>
                <div className="mt-2 text-sm text-[#102B53]/70">
                  Progress within the current season quarter (0–90°).
                </div>
                <ProgressBar
                  value={derived.seasonProgress}
                  labelLeft={derived.ok ? `${derived.seasonDeg?.toFixed(2)}°` : "—"}
                  labelRight="90°"
                />
              </div>
            </div>

            {/* DIAL (center visual aid) */}
            <div className="mt-8">
              <div className="rounded-3xl border border-black/10 bg-white/50 px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] tracking-[0.18em] uppercase text-[#102B53]/60">
                    Cycle Wheel
                  </div>
                  <div className="text-xs text-[#102B53]/70">
                    {cyclePosDeg != null ? `${norm360(cyclePosDeg).toFixed(2)}°` : "—"}
                  </div>
                </div>

                <div className="mt-5">
                  {cyclePosDeg != null ? (
                    <AscYearDial cyclePosDeg={cyclePosDeg} />
                  ) : (
                    <div className="text-center text-sm text-[#102B53]/70 py-14">
                      Cycle position unavailable.
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center text-sm text-[#102B53]/70">
                  0° starts at your natal ASC; the hand moves with the transiting Sun.
                </div>
              </div>
            </div>

            {/* FOOT: navigation */}
            <div className="mt-7 flex flex-wrap gap-2 justify-center">
              <Link
                href="/seasons"
                className="rounded-2xl bg-[#102B53] text-white px-4 py-2 text-sm hover:opacity-90"
              >
                Go to /seasons
              </Link>
              <Link
                href="/calendar"
                className="rounded-2xl border border-[#102B53]/20 bg-white/60 text-[#102B53] px-4 py-2 text-sm hover:bg-white/70"
              >
                Go to /calendar
              </Link>
            </div>

            <div className="mt-5 text-center text-xs text-[#102B53]/55">
              {asOfLine}
            </div>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
