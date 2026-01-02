// src/app/profile/ui/ProfileClient.tsx
"use client";

import Link from "next/link";
import React, { useMemo } from "react";

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
  return SIGNS[Math.floor(norm360(lon) / 30) % 12];
}

function fmtLon(lon: number) {
  const x = norm360(lon);
  const degInSign = x % 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  return `${d}° ${String(m).padStart(2, "0")}'`;
}

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

const SEASON_SHORT: Record<(typeof SEASONS)[number], string> = {
  Spring: "SPRG",
  Summer: "SUMR",
  Fall: "FALL",
  Winter: "WNTR",
};

// mean solar motion (deg/day) used for estimating shift timing
const MEAN_SOLAR_RATE = 0.985647;

function ProgressBar({
  value,
  labelLeft,
  labelRight,
  meta,
}: {
  value: number; // 0..1
  labelLeft: string;
  labelRight: string;
  meta?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-[#102B53]/70">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>

      {meta ? (
        <div className="mt-1 text-xs text-[#102B53]/65">{meta}</div>
      ) : null}

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

function Chip({ k, v }: { k: string; v: React.ReactNode }) {
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
 * Dial: 8-phase ring, season axes, labels, and a hand that points to cyclePosDeg.
 *
 * IMPORTANT: URA Profile Dial orientation:
 *   0° at LEFT (Spring)
 *   90° at BOTTOM (Summer)
 *   180° at RIGHT (Fall)
 *   270° at TOP (Winter)
 */
function AscYearDial({ cyclePosDeg }: { cyclePosDeg: number }) {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;

  const ringR = 112; // ring radius
  const discR = 92; // inner disc radius
  const outerR = ringR + 34;

  const angle = norm360(cyclePosDeg);

  // 0° LEFT, 90° DOWN, 180° RIGHT, 270° UP
  const rad = ((angle + 180) * Math.PI) / 180;

  const handLen = discR + 28;
  const hx = cx + handLen * Math.cos(rad);
  const hy = cy + handLen * Math.sin(rad);

  const majorTicks = Array.from({ length: 8 }, (_, i) => i * 45);
  const minorTicks = Array.from({ length: 16 }, (_, i) => i * 22.5);

  const tickLine = (deg: number, major: boolean) => {
    const a = ((deg + 180) * Math.PI) / 180;
    const r1 = major ? ringR + 10 : ringR + 14;
    const r2 = major ? ringR + 30 : ringR + 22;
    return {
      x1: cx + r1 * Math.cos(a),
      y1: cy + r1 * Math.sin(a),
      x2: cx + r2 * Math.cos(a),
      y2: cy + r2 * Math.sin(a),
    };
  };

  const labelR = outerR - 6;
  const labelStyle = {
    fill: "rgba(16,43,83,0.72)",
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: 700 as const,
  };

  return (
    <div className="mx-auto relative w-[360px] h-[360px] flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-white/25 blur-[22px]" />
      <div className="relative rounded-full border border-black/10 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,.7)] w-[350px] h-[350px] flex items-center justify-center">
        <svg width={size} height={size} className="block">
          <defs>
            <radialGradient id="ura_disc" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.70)" />
              <stop offset="100%" stopColor="rgba(16,43,83,0.10)" />
            </radialGradient>
          </defs>

          {/* outer halo ring */}
          <circle
            cx={cx}
            cy={cy}
            r={outerR}
            fill="none"
            stroke="rgba(16,43,83,0.14)"
            strokeWidth="2"
          />

          {/* season axes (0/90/180/270) */}
          {[0, 90, 180, 270].map((deg) => {
            const a = ((deg + 180) * Math.PI) / 180;
            const r0 = ringR - 10;
            const r1 = ringR + 8;
            const x0 = cx + r0 * Math.cos(a);
            const y0 = cy + r0 * Math.sin(a);
            const x1 = cx + r1 * Math.cos(a);
            const y1 = cy + r1 * Math.sin(a);

            // Make 0° axis (Spring/left) slightly stronger
            const isZero = deg === 0;
            return (
              <line
                key={deg}
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke={isZero ? "rgba(16,43,83,0.35)" : "rgba(16,43,83,0.22)"}
                strokeWidth={isZero ? 3 : 2}
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
                stroke="rgba(16,43,83,0.18)"
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

          {/* season labels: LEFT SPRG, DOWN SUMR, RIGHT FALL, UP WNTR */}
          <text
            x={cx}
            y={cy - labelR}
            textAnchor="middle"
            dominantBaseline="middle"
            style={labelStyle}
          >
            WNTR
          </text>
          <text
            x={cx + labelR}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            style={labelStyle}
          >
            FALL
          </text>
          <text
            x={cx}
            y={cy + labelR}
            textAnchor="middle"
            dominantBaseline="middle"
            style={labelStyle}
          >
            SUMR
          </text>
          <text
            x={cx - labelR}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            style={labelStyle}
          >
            SPRG
          </text>

          {/* inner disc */}
          <circle
            cx={cx}
            cy={cy}
            r={discR}
            fill="url(#ura_disc)"
            stroke="rgba(0,0,0,0.10)"
            strokeWidth="1"
          />

          {/* hand */}
          <line
            x1={cx}
            y1={cy}
            x2={hx}
            y2={hy}
            stroke="rgba(16,43,83,0.78)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="4.6" fill="rgba(16,43,83,0.80)" />
          <circle cx={hx} cy={hy} r="3.6" fill="rgba(80,105,141,0.95)" />
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
        season: null as string | null,
        seasonShort: "—",
        phaseIndex: null as number | null,
        phaseDeg: null as number | null,
        seasonDeg: null as number | null,
        phaseProgress: 0,
        seasonProgress: 0,
        nextLabel: "—",
        shiftText: "—",
        seasonDay: null as number | null,
        remainingDeg: null as number | null,
        daysToBoundary: null as number | null,
      };
    }

    // 8 phases of 45°
    const phaseIndex = Math.floor(cycle / 45) + 1; // 1..8
    const phaseStart = (phaseIndex - 1) * 45;
    const phaseDeg = cycle - phaseStart; // 0..45
    const phaseProgress = phaseDeg / 45;

    // season mapping by phases: (1–2 Spring, 3–4 Summer, 5–6 Fall, 7–8 Winter)
    const seasonIndex = Math.floor((phaseIndex - 1) / 2); // 0..3
    const season = SEASONS[seasonIndex];
    const seasonShort = SEASON_SHORT[season];

    const seasonStart = seasonIndex * 90;
    const seasonDeg = cycle - seasonStart; // 0..90
    const seasonProgress = seasonDeg / 90;

    // Day X / 90 (proportional day index)
    const seasonDay = Math.max(
      1,
      Math.min(90, Math.floor(seasonProgress * 90) + 1)
    );

    // next phase + shift estimate (wrap-safe)
    const nextPhase = phaseIndex === 8 ? 1 : phaseIndex + 1;
    const boundaryDeg = phaseIndex * 45; // end of current phase
    let remainingDeg = boundaryDeg - cycle;
    if (remainingDeg < 0) remainingDeg += 360;
    if (Math.abs(remainingDeg) < 1e-9) remainingDeg = 0;

    const daysToBoundary = remainingDeg / MEAN_SOLAR_RATE;
    const asOf = asOfISO ? new Date(asOfISO) : new Date();
    const shiftAt = new Date(asOf.getTime() + daysToBoundary * 86400000);

    const shiftText = `~${daysToBoundary.toFixed(1)} days • ${shiftAt.toLocaleString(
      undefined,
      {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    )}`;

    const nextSeason = SEASONS[Math.floor((nextPhase - 1) / 2)];
    const nextSeasonShort = SEASON_SHORT[nextSeason];
    const nextLabel = `${nextSeasonShort} · Phase ${nextPhase}`;

    return {
      ok: true as const,
      season,
      seasonShort,
      phaseIndex,
      phaseDeg,
      seasonDeg,
      phaseProgress,
      seasonProgress,
      nextLabel,
      shiftText,
      seasonDay,
      remainingDeg,
      daysToBoundary,
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
    natalAscLon != null
      ? `${signFromLon(natalAscLon)} ${fmtLon(natalAscLon)}`
      : "—";
  const natalSun =
    natalSunLon != null
      ? `${signFromLon(natalSunLon)} ${fmtLon(natalSunLon)}`
      : "—";
  const natalMoon =
    natalMoonLon != null
      ? `${signFromLon(natalMoonLon)} ${fmtLon(natalMoonLon)}`
      : "—";

  // NOTE: still wired to whatever "moving" longitudes are currently being passed.
  // We'll swap these to progressed Sun/Moon once we confirm the cache keys.
  const movingSun =
    movingSunLon != null
      ? `${signFromLon(movingSunLon)} ${fmtLon(movingSunLon)}`
      : "—";
  const movingMoon =
    movingMoonLon != null
      ? `${signFromLon(movingMoonLon)} ${fmtLon(movingMoonLon)}`
      : "—";

  // Current Zodiac = current Sun longitude (still sign-based 30° markers)
  const currentZodiac =
    movingSunLon != null ? `${signFromLon(movingSunLon)} ${fmtLon(movingSunLon)}` : "—";

  return (
    <div className="mt-8">
      {/* TOP STRIP */}
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
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
                Orientation
              </div>

              {/* Stacked: Season above Phase */}
              <div className="mt-2 text-3xl font-semibold tracking-tight text-[#102B53] leading-tight">
                <div className="flex justify-center">
                  <div>{derived.ok ? derived.seasonShort : "—"}</div>
                </div>
                <div className="flex justify-center">
                  <div>
                    {derived.ok && derived.phaseIndex != null
                      ? `Phase ${derived.phaseIndex}`
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-sm text-[#102B53]/70">
                {derived.ok && derived.phaseDeg != null
                  ? `Degrees into phase: ${derived.phaseDeg.toFixed(2)}° / 45°`
                  : "Cycle position unavailable."}
              </div>
            </div>

            {/* TOP ROW: Current Zodiac + Shift + Next */}
            <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
              <SubCard title="Current Zodiac">
                <div className="text-sm font-semibold text-[#102B53]">
                  {currentZodiac}
                </div>
                <div className="mt-1 text-sm text-[#102B53]/70">
                  Current Sun position (sign changes at 30° markers).
                </div>
              </SubCard>

              <SubCard title="Shift">
                <div className="text-sm font-semibold text-[#102B53]">
                  {derived.ok ? derived.shiftText : "—"}
                </div>
                <div className="mt-1 text-sm text-[#102B53]/70">
                  Estimated phase boundary crossing (mean solar rate).
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
            </div>

            {/* PROGRESS: Season arc + Phase boundary (replaces Cycle Position) */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/10 bg-white/55 px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#102B53]/60">
                  90° Season Arc
                </div>
                <div className="mt-2 text-sm text-[#102B53]/70">
                  Progress within the current season (0–90°).
                </div>

                <ProgressBar
                  value={derived.seasonProgress}
                  labelLeft="0°"
                  labelRight="90°"
                  meta={
                    derived.ok && derived.seasonDay != null && derived.seasonDeg != null
                      ? `Day ${derived.seasonDay}/90 • ${derived.seasonDeg.toFixed(
                          2
                        )}° / 90°`
                      : "—"
                  }
                />
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/55 px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#102B53]/60">
                  Phase Boundary
                </div>
                <div className="mt-2 text-sm text-[#102B53]/70">
                  Remaining to next 45° boundary.
                </div>

                <ProgressBar
                  value={derived.ok ? 1 - derived.phaseProgress : 0}
                  labelLeft={
                    derived.ok && derived.remainingDeg != null
                      ? `${derived.remainingDeg.toFixed(2)}°`
                      : "—"
                  }
                  labelRight="0°"
                  meta={
                    derived.ok && derived.daysToBoundary != null
                      ? `~${derived.daysToBoundary.toFixed(1)} days`
                      : "—"
                  }
                />
              </div>
            </div>

            {/* DIAL */}
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

                <div className="mt-6">
                  {cyclePosDeg != null ? (
                    <AscYearDial cyclePosDeg={cyclePosDeg} />
                  ) : (
                    <div className="text-center text-sm text-[#102B53]/70 py-14">
                      Cycle position unavailable.
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center text-sm text-[#102B53]/70">
                  0° starts at your natal ASC; the hand moves with the cycle position.
                </div>
              </div>
            </div>

            {/* FOOT */}
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
