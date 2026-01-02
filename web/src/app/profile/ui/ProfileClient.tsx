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
      <div className="flex items-center justify-between text-xs text-[#403A32]/70">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>

      {meta ? <div className="mt-1 text-xs text-[#403A32]/70">{meta}</div> : null}

      <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
        <div className="h-full rounded-full bg-[#8C8377]" style={{ width: `${pct}%` }} />
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
        "rounded-3xl border border-[#E2D9CC] bg-[#F4EFE6]",
        "shadow-[0_30px_120px_rgba(0,0,0,0.45)]",
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
    <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="min-w-[92px]">
      <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/70">
        {k}
      </div>
      <div className="mt-1 text-sm text-[#F4EFE6] font-medium">{v}</div>
    </div>
  );
}

/**
 * Dial: 8-phase ring, season axes, labels, and a hand that points to cyclePosDeg.
 *
 * ORIENTATION:
 *   0°  at LEFT  (SPRG)
 *   90° at DOWN  (SUMR)
 *   180° at RIGHT (FALL)
 *   270° at UP   (WNTR)
 *
 * NOTE: cyclePosDeg increases in ecliptic longitude direction; to match visual seasons,
 * we invert the angle so the hand runs in the intended quadrant flow.
 */
function AscYearDial({ cyclePosDeg }: { cyclePosDeg: number }) {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;

  const ringR = 112;
  const discR = 92;
  const outerR = ringR + 34;

  const angle = norm360(cyclePosDeg);

  // Inverted to align cyclePosDeg direction with the visual axes
  const rad = ((-angle + 180) * Math.PI) / 180;

  const handLen = discR + 28;
  const hx = cx + handLen * Math.cos(rad);
  const hy = cy + handLen * Math.sin(rad);

  const majorTicks = Array.from({ length: 8 }, (_, i) => i * 45);
  const minorTicks = Array.from({ length: 16 }, (_, i) => i * 22.5);

  const tickLine = (deg: number, major: boolean) => {
    const a = ((-deg + 180) * Math.PI) / 180;
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

  return (
    <div className="mx-auto relative w-[360px] h-[360px] flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-black/10 blur-[24px]" />
      <div className="relative rounded-full border border-black/10 bg-[#F8F2E8] w-[350px] h-[350px] flex items-center justify-center">
        <svg width={size} height={size} className="block">
          <defs>
            <radialGradient id="ura_disc" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
              <stop offset="60%" stopColor="rgba(245,239,230,0.70)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.10)" />
            </radialGradient>
          </defs>

          <circle
            cx={cx}
            cy={cy}
            r={outerR}
            fill="none"
            stroke="rgba(0,0,0,0.10)"
            strokeWidth="2"
          />

          {/* season axes (0/90/180/270) */}
          {[0, 90, 180, 270].map((deg) => {
            const a = ((-deg + 180) * Math.PI) / 180;
            const r0 = ringR - 10;
            const r1 = ringR + 8;
            const x0 = cx + r0 * Math.cos(a);
            const y0 = cy + r0 * Math.sin(a);
            const x1 = cx + r1 * Math.cos(a);
            const y1 = cy + r1 * Math.sin(a);

            const isZero = deg === 0;
            return (
              <line
                key={deg}
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke={isZero ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.18)"}
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
                stroke="rgba(0,0,0,0.14)"
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
                stroke="rgba(0,0,0,0.22)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}

          {/* labels (abbrev) */}
          <text
            x={cx}
            y={cy - labelR}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: "rgba(0,0,0,0.65)",
              fontSize: 12,
              letterSpacing: 1.4,
              fontWeight: 700,
            }}
          >
            WNTR
          </text>
          <text
            x={cx + labelR}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: "rgba(0,0,0,0.65)",
              fontSize: 12,
              letterSpacing: 1.4,
              fontWeight: 700,
            }}
          >
            FALL
          </text>
          <text
            x={cx}
            y={cy + labelR}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: "rgba(0,0,0,0.65)",
              fontSize: 12,
              letterSpacing: 1.4,
              fontWeight: 700,
            }}
          >
            SUMR
          </text>
          <text
            x={cx - labelR}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: "rgba(0,0,0,0.65)",
              fontSize: 12,
              letterSpacing: 1.4,
              fontWeight: 700,
            }}
          >
            SPRG
          </text>

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
            stroke="rgba(0,0,0,0.70)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="4.6" fill="rgba(0,0,0,0.65)" />
          <circle cx={hx} cy={hy} r="3.6" fill="rgba(140,131,119,0.95)" />
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

    // seasons by phase pairs: (1–2 SPRG, 3–4 SUMR, 5–6 FALL, 7–8 WNTR)
    const seasonIndex = Math.floor((phaseIndex - 1) / 2); // 0..3
    const season = SEASONS[seasonIndex];
    const seasonShort = SEASON_SHORT[season];

    const seasonStart = seasonIndex * 90;
    const seasonDeg = cycle - seasonStart; // 0..90
    const seasonProgress = seasonDeg / 90;

    const seasonDay = Math.max(
      1,
      Math.min(90, Math.floor(seasonProgress * 90) + 1)
    );

    // next phase boundary (wrap-safe)
    const nextPhase = phaseIndex === 8 ? 1 : phaseIndex + 1;
    const boundaryDeg = phaseIndex * 45;
    let remainingDeg = boundaryDeg - cycle;
    if (remainingDeg < 0) remainingDeg += 360;

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
    natalAscLon != null ? `${signFromLon(natalAscLon)} ${fmtLon(natalAscLon)}` : "—";
  const natalSun =
    natalSunLon != null ? `${signFromLon(natalSunLon)} ${fmtLon(natalSunLon)}` : "—";
  const natalMoon =
    natalMoonLon != null ? `${signFromLon(natalMoonLon)} ${fmtLon(natalMoonLon)}` : "—";

  const movingSun =
    movingSunLon != null ? `${signFromLon(movingSunLon)} ${fmtLon(movingSunLon)}` : "—";
  const movingMoon =
    movingMoonLon != null ? `${signFromLon(movingMoonLon)} ${fmtLon(movingMoonLon)}` : "—";

  const currentZodiac =
    movingSunLon != null ? `${signFromLon(movingSunLon)} ${fmtLon(movingSunLon)}` : "—";

  // LLM-ready phase brief template (deterministic for now)
  const phaseBrief = useMemo(() => {
    if (!derived.ok || derived.phaseIndex == null || derived.phaseDeg == null || derived.seasonShort === "—") {
      return {
        title: "Phase Brief",
        lines: [
          "Cycle position unavailable.",
          "Once the server LLM is connected, this panel will render an interpretation grounded in URA ontology.",
        ],
      };
    }

    const seasonShort = derived.seasonShort;
    const phase = derived.phaseIndex;
    const phaseDeg = derived.phaseDeg;
    const remaining = derived.remainingDeg ?? 0;
    const day = derived.seasonDay ?? 1;

    // Ontology framing (placeholder but aligned)
    const frame = `You are in ${seasonShort} — Phase ${phase}.`;
    const mechanics = `You are ${phaseDeg.toFixed(2)}° into this 45° phase. (${remaining.toFixed(
      2
    )}° remaining to boundary)`;
    const seasonArc = `Season arc: Day ${day}/90 (${(derived.seasonDeg ?? 0).toFixed(2)}° / 90°).`;
    const zodiac = `Current Zodiac (Sun): ${currentZodiac}.`;

    // simple “intent” by phase pair (still deterministic; we’ll refine with your URA language later)
    const intent =
      phase <= 2
        ? "Intent: Initiate + orient. Build momentum with clean fundamentals."
        : phase <= 4
        ? "Intent: Expand + execute. Lean into output and visible progress."
        : phase <= 6
        ? "Intent: Refine + harvest. Edit, distill, and consolidate gains."
        : "Intent: Release + reset. Simplify, restore, and prepare the next turn.";

    const prompts = [
      "LLM Prompt (server):",
      `Return a concise interpretation for ${seasonShort} Phase ${phase} using URA ontology.`,
      `Include: (1) Orientation, (2) Focus, (3) Watch-outs, (4) One practical next step.`,
      `Use the numeric context: cyclePosDeg=${cyclePosDeg?.toFixed(2) ?? "—"}, phaseDeg=${phaseDeg.toFixed(
        2
      )}, seasonDay=${day}, currentZodiac="${currentZodiac}".`,
    ];

    return {
      title: "Phase Brief (Ontology + LLM-ready)",
      lines: [frame, mechanics, seasonArc, zodiac, intent, "", ...prompts],
    };
  }, [derived, currentZodiac, cyclePosDeg]);

  return (
    <div className="mt-8">
      {/* TOP STRIP */}
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-10 w-10 rounded-2xl bg-[#151515] border border-[#E2D9CC]/25 flex items-center justify-center text-[#F4EFE6]/70 text-xs">
              +
            </div>

            <div>
              <div className="text-[#F4EFE6]/80 text-sm">Profile</div>
              <div className="text-[#F4EFE6] text-lg font-semibold leading-tight">
                {name}
              </div>
              <div className="text-[#F4EFE6]/65 text-sm">{locationLine}</div>
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
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                Orientation
              </div>

              {/* Stacked: Season above Phase */}
              <div className="mt-2 text-3xl font-semibold tracking-tight text-[#1F1B16] leading-tight">
                <div className="flex justify-center">
                  <div>{derived.ok ? derived.seasonShort : "—"}</div>
                </div>
                <div className="flex justify-center">
                  <div>
                    {derived.ok && derived.phaseIndex != null ? `Phase ${derived.phaseIndex}` : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-sm text-[#403A32]/75">
                {derived.ok && derived.phaseDeg != null
                  ? `Degrees into phase: ${derived.phaseDeg.toFixed(2)}° / 45°`
                  : "Cycle position unavailable."}
              </div>
            </div>

            {/* TOP ROW */}
            <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
              <SubCard title="Current Zodiac">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {currentZodiac}
                </div>
                <div className="mt-1 text-sm text-[#403A32]/75">
                  Current Sun position (sign changes at 30° markers).
                </div>
              </SubCard>

              <SubCard title="Shift">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {derived.ok ? derived.shiftText : "—"}
                </div>
                <div className="mt-1 text-sm text-[#403A32]/75">
                  Estimated phase boundary crossing (mean solar rate).
                </div>
              </SubCard>

              <SubCard title="Next">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {derived.ok ? derived.nextLabel : "—"}
                </div>
                <div className="mt-1 text-sm text-[#403A32]/75">
                  The next 45° segment (phase boundary).
                </div>
              </SubCard>
            </div>

            {/* PROGRESS */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                  90° Season Arc
                </div>
                <div className="mt-2 text-sm text-[#403A32]/75">
                  Progress within the current season (0–90°).
                </div>

                <ProgressBar
                  value={derived.seasonProgress}
                  labelLeft="0°"
                  labelRight="90°"
                  meta={
                    derived.ok && derived.seasonDay != null && derived.seasonDeg != null
                      ? `Day ${derived.seasonDay}/90 • ${derived.seasonDeg.toFixed(2)}° / 90°`
                      : "—"
                  }
                />
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                  Phase Boundary
                </div>
                <div className="mt-2 text-sm text-[#403A32]/75">
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

            {/* DIAL + PHASE BRIEF */}
            <div className="mt-8">
              <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                    Cycle Wheel
                  </div>
                  <div className="text-xs text-[#403A32]/70">
                    {cyclePosDeg != null ? `${norm360(cyclePosDeg).toFixed(2)}°` : "—"}
                  </div>
                </div>

                <div className="mt-6">
                  {cyclePosDeg != null ? (
                    <AscYearDial cyclePosDeg={cyclePosDeg} />
                  ) : (
                    <div className="text-center text-sm text-[#403A32]/70 py-14">
                      Cycle position unavailable.
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center text-sm text-[#403A32]/75">
                  0° starts at your natal ASC; the hand moves with the cycle position.
                </div>

                {/* NEW: Phase Brief module (LLM-ready) */}
                <div className="mt-6 rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
                  <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                    {phaseBrief.title}
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-[#1F1B16]/90">
                    {phaseBrief.lines.map((line, idx) => (
                      <div key={idx} className={line === "" ? "h-2" : ""}>
                        {line === "" ? null : line}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-[#403A32]/70">
                    This will be server-rendered once the URA LLM endpoint is added.
                  </div>
                </div>
              </div>
            </div>

            {/* FOOT */}
            <div className="mt-7 flex flex-wrap gap-2 justify-center">
              <Link
                href="/seasons"
                className="rounded-2xl bg-[#151515] text-[#F4EFE6] px-4 py-2 text-sm border border-[#E2D9CC]/40 hover:bg-[#1E1E1E]"
              >
                Go to /seasons
              </Link>
              <Link
                href="/calendar"
                className="rounded-2xl bg-[#F4EFE6] text-[#151515] px-4 py-2 text-sm border border-black/15 hover:bg-[#EFE7DB]"
              >
                Go to /calendar
              </Link>
            </div>

            <div className="mt-5 text-center text-xs text-[#403A32]/70">
              {asOfLine}
            </div>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
