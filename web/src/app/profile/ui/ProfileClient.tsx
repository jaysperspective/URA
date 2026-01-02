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
 * Sideways figure-8 waveform (∞) for the 0–360 cycle position.
 * Labels are fixed to cardinal anchors:
 *  - SPRG = top center
 *  - FALL = bottom center
 *  - WNTR = left center
 *  - SUMR = right center
 */
function AscYearFigure8({ cyclePosDeg }: { cyclePosDeg: number }) {
  const size = 760;
  const H = 260;

  const cx = size / 2;
  const cy = H / 2;

  const pos = norm360(cyclePosDeg);
  const t = (pos / 360) * Math.PI * 2;

  // Sideways ∞ curve
  const a = 290; // x radius
  const b = 95; // y radius

  // Curve: x = sin(t), y = sin(2t)  (scaled)
  const X = (tt: number) => cx + a * Math.sin(tt);
  const Y = (tt: number) => cy - b * Math.sin(2 * tt);

  const pathD = useMemo(() => {
    const step = 0.02;
    let d = `M ${X(0).toFixed(2)} ${Y(0).toFixed(2)}`;
    for (let tt = step; tt <= Math.PI * 2 + step; tt += step) {
      d += ` L ${X(tt).toFixed(2)} ${Y(tt).toFixed(2)}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const px = X(t);
  const py = Y(t);

  const labelStyle: React.CSSProperties = {
    fill: "rgba(64,58,50,0.65)",
    fontSize: 11,
    letterSpacing: "0.14em",
    fontWeight: 700,
  };

  // Fixed label positions (not on the curve)
  const labelFixed = [
    // left/right centered
    { txt: "WNTR", x: cx - a - 34, y: cy + 4, anchor: "start" as const },
    { txt: "SUMR", x: cx + a + 34, y: cy + 4, anchor: "end" as const },

    // top/bottom at the crossing
    { txt: "SPRG", x: cx, y: cy - b - 22, anchor: "middle" as const },
    { txt: "FALL", x: cx, y: cy + b + 34, anchor: "middle" as const },
  ];

  return (
    <div className="mx-auto w-full max-w-[820px]">
      <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
            Cycle Waveform
          </div>
          <div className="text-xs text-[#403A32]/70">{pos.toFixed(2)}°</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <svg width={size} height={H} className="block">
            {/* crosshair (ontology axes) */}
            <line
              x1={0}
              y1={cy}
              x2={size}
              y2={cy}
              stroke="rgba(0,0,0,0.10)"
              strokeWidth="1"
            />
            <line
              x1={cx}
              y1={0}
              x2={cx}
              y2={H}
              stroke="rgba(0,0,0,0.10)"
              strokeWidth="1"
            />

            {/* curve */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(0,0,0,0.58)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* marker */}
            <circle cx={px} cy={py} r="6" fill="rgba(140,131,119,0.95)" />
            <circle cx={px} cy={py} r="12" fill="rgba(140,131,119,0.16)" />

            {/* labels */}
            {labelFixed.map((l) => (
              <text
                key={l.txt}
                x={l.x}
                y={l.y}
                textAnchor={l.anchor}
                style={labelStyle}
              >
                {l.txt}
              </text>
            ))}
          </svg>
        </div>

        <div className="mt-3 text-center text-sm text-[#403A32]/75">
          Sideways ∞ map. Marker = current cycle position (0–360°).
        </div>
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

    const phaseIndex = Math.floor(cycle / 45) + 1; // 1..8
    const phaseStart = (phaseIndex - 1) * 45;
    const phaseDeg = cycle - phaseStart;
    const phaseProgress = phaseDeg / 45;

    const seasonIndex = Math.floor((phaseIndex - 1) / 2); // 0..3
    const season = SEASONS[seasonIndex];
    const seasonShort = SEASON_SHORT[season];

    const seasonStart = seasonIndex * 90;
    const seasonDeg = cycle - seasonStart;
    const seasonProgress = seasonDeg / 90;

    const seasonDay = Math.max(
      1,
      Math.min(90, Math.floor(seasonProgress * 90) + 1)
    );

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

  const phaseBrief = useMemo(() => {
    if (!derived.ok || derived.phaseIndex == null || derived.phaseDeg == null) {
      return {
        title: "Phase Brief (Ontology + LLM-ready)",
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

    const frame = `You are in ${seasonShort} — Phase ${phase}.`;
    const mechanics = `You are ${phaseDeg.toFixed(2)}° into this 45° phase. (${remaining.toFixed(
      2
    )}° remaining to boundary)`;
    const seasonArc = `Season arc: Day ${day}/90 (${(derived.seasonDeg ?? 0).toFixed(2)}° / 90°).`;
    const zodiac = `Current Zodiac (Sun): ${currentZodiac}.`;

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
      `Use numeric context: cyclePosDeg=${cyclePosDeg?.toFixed(2) ?? "—"}, phaseDeg=${phaseDeg.toFixed(
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
                <div className="text-sm font-semibold text-[#1F1B16]">{currentZodiac}</div>
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

            {/* FIGURE-8 + PHASE BRIEF */}
            <div className="mt-8">
              {cyclePosDeg != null ? (
                <AscYearFigure8 cyclePosDeg={cyclePosDeg} />
              ) : (
                <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-10 text-center text-sm text-[#403A32]/70">
                  Cycle position unavailable.
                </div>
              )}

              <div className="mt-4 rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-6">
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

            <div className="mt-5 text-center text-xs text-[#403A32]/70">{asOfLine}</div>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
