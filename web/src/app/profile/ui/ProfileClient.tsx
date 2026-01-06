// src/app/profile/ui/ProfileClient.tsx
"use client";

import Link from "next/link";
import React, { useMemo } from "react";
import PhaseMicrocopyCard from "@/components/PhaseMicrocopyCard";
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";
import URAFoundationPanel from "@/components/ura/URAFoundationPanel";

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
  Spring: "Spring",
  Summer: "Summer",
  Fall: "Fall",
  Winter: "Winter",
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
    { txt: "WNTR", x: cx - a - 34, y: cy + 4, anchor: "start" as const },
    { txt: "SUMR", x: cx + a + 34, y: cy + 4, anchor: "end" as const },
    { txt: "SPRG", x: cx, y: cy - b - 22, anchor: "middle" as const },
    { txt: "FALL", x: cx, y: cy + b + 34, anchor: "middle" as const },
  ];

  return (
    <div className="mx-auto w-full max-w-[820px]">
      <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
            Cycle Waveform (Asc-Year)
          </div>
          <div className="text-xs text-[#403A32]/70">{pos.toFixed(2)}°</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <svg width={size} height={H} className="block">
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

            <path
              d={pathD}
              fill="none"
              stroke="rgba(0,0,0,0.58)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle cx={px} cy={py} r="6" fill="rgba(140,131,119,0.95)" />
            <circle cx={px} cy={py} r="12" fill="rgba(140,131,119,0.16)" />

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
          Sideways ∞ map. Marker = current Asc-Year cycle position (0–360°).
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

  // ✅ These now represent PROGRESSED Sun/Moon (fed by page.tsx)
  movingSunLon: number | null;
  movingMoonLon: number | null;

  // Asc-Year (0..360)
  cyclePosDeg: number | null;
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
    movingSunLon, // progressed sun
    movingMoonLon, // progressed moon
    cyclePosDeg,
  } = props;

  // ✅ Asc-Year is authoritative for Orientation + Phase
  const asc = useMemo(() => {
    const cycle = cyclePosDeg != null ? norm360(cyclePosDeg) : null;

    if (cycle == null) {
      return {
        ok: false as const,
        season: null as (typeof SEASONS)[number] | null,
        seasonShort: "—",
        phaseId: null as number | null, // 1..8
        phaseDeg: null as number | null,
        phaseProgress: 0,
        seasonDeg: null as number | null,
        seasonProgress: 0,
        seasonDay: null as number | null,

        nextPhaseId: null as number | null,
        nextLabel: "—",
        remainingDeg: null as number | null,
        daysToBoundary: null as number | null,
        shiftText: "—",
      };
    }

    const phaseId = Math.floor(cycle / 45) + 1; // 1..8
    const phaseStart = (phaseId - 1) * 45;
    const phaseDeg = cycle - phaseStart;
    const phaseProgress = phaseDeg / 45;

    const seasonIndex = Math.floor((phaseId - 1) / 2); // 0..3
    const season = SEASONS[seasonIndex];
    const seasonShort = SEASON_SHORT[season];

    const seasonStart = seasonIndex * 90;
    const seasonDeg = cycle - seasonStart;
    const seasonProgress = seasonDeg / 90;

    const seasonDay = Math.max(
      1,
      Math.min(90, Math.floor(seasonProgress * 90) + 1)
    );

    const nextPhaseId = phaseId === 8 ? 1 : phaseId + 1;
    const nextSeason = SEASONS[Math.floor((nextPhaseId - 1) / 2)];
    const nextLabel = `${SEASON_SHORT[nextSeason]} · Phase ${nextPhaseId}`;

    const boundaryDeg = phaseId * 45;
    let remainingDeg = boundaryDeg - cycle;
    if (remainingDeg < 0) remainingDeg += 360;

    const daysToBoundary = remainingDeg / MEAN_SOLAR_RATE;
    const asOf = asOfISO ? new Date(asOfISO) : new Date();
    const shiftAt = new Date(asOf.getTime() + daysToBoundary * 86400000);

    const shiftText = `~${daysToBoundary.toFixed(
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
      seasonShort,
      phaseId,
      phaseDeg,
      phaseProgress,
      seasonDeg,
      seasonProgress,
      seasonDay,
      nextPhaseId,
      nextLabel,
      remainingDeg,
      daysToBoundary,
      shiftText,
    };
  }, [cyclePosDeg, asOfISO]);

  // Phase microcopy follows Asc-Year phase (authoritative)
  const phaseCopy = useMemo(() => {
    const p = asc.phaseId;
    if (typeof p === "number" && p >= 1 && p <= 8) return microcopyForPhase(p as PhaseId);
    return microcopyForPhase(1);
  }, [asc.phaseId]);

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

  const progressedSun =
    movingSunLon != null ? `${signFromLon(movingSunLon)} ${fmtLon(movingSunLon)}` : "—";
  const progressedMoon =
    movingMoonLon != null ? `${signFromLon(movingMoonLon)} ${fmtLon(movingMoonLon)}` : "—";

  // ✅ “Current Zodiac” for Profile = Progressed Sun
  const currentZodiac = progressedSun;

  // URAFoundationPanel should be fed Asc-Year values, and Sun text should show progressed Sun.
  const foundationPhaseId = asc.phaseId;
  const foundationProgress01 = asc.ok ? asc.phaseProgress : null;
  const foundationSunText = progressedSun;

  const phaseBrief = useMemo(() => {
    const p = asc.phaseId;

    if (!asc.ok || p == null) {
      return {
        title: "Phase Brief (Asc-Year authoritative)",
        lines: [
          "Cycle position unavailable.",
          "Once the server LLM is connected, this panel will render an interpretation grounded in URA ontology.",
        ],
      };
    }

    const frame = `You are in ${asc.seasonShort} — Phase ${p}.`;
    const mechanics = `Degrees into phase: ${(asc.phaseDeg ?? 0).toFixed(2)}° / 45°`;
    const seasonArc = `Season arc: Day ${asc.seasonDay ?? "—"}/90 (${(asc.seasonDeg ?? 0).toFixed(
      2
    )}° / 90°).`;
    const zodiac = `Current Zodiac (Progressed Sun): ${currentZodiac}.`;

    const intent =
      p <= 2
        ? "Intent: Initiate + orient. Build momentum with clean fundamentals."
        : p <= 4
        ? "Intent: Expand + execute. Lean into output and visible progress."
        : p <= 6
        ? "Intent: Refine + harvest. Edit, distill, and consolidate gains."
        : "Intent: Release + reset. Simplify, restore, and prepare the next turn.";

    const prompts = [
      "LLM Prompt (server):",
      `Return a concise interpretation for ${asc.seasonShort} Phase ${p} using URA ontology.`,
      `Include: (1) Orientation, (2) Focus, (3) Watch-outs, (4) One practical next step.`,
      `Use numeric context: ascCyclePosDeg=${cyclePosDeg?.toFixed(2) ?? "—"}, phaseDeg=${(
        asc.phaseDeg ?? 0
      ).toFixed(2)}, seasonDay=${asc.seasonDay ?? "—"}, progressedSun="${currentZodiac}".`,
    ];

    return {
      title: "Phase Brief (Asc-Year authoritative)",
      lines: [frame, mechanics, seasonArc, zodiac, intent, "", ...prompts],
    };
  }, [asc, currentZodiac, cyclePosDeg]);

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
            <Chip k="Sun (Progressed)" v={progressedSun} />
            <Chip k="Moon (Progressed)" v={progressedMoon} />
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
                ORIENTATION
              </div>

              <div className="mt-2 text-3xl font-semibold tracking-tight text-[#1F1B16] leading-tight">
                <div className="flex justify-center">
                  <div>{asc.ok ? asc.seasonShort : "—"}</div>
                </div>
                <div className="flex justify-center">
                  <div>{asc.ok && asc.phaseId != null ? `Phase ${asc.phaseId}` : "—"}</div>
                </div>
              </div>

              <div className="mt-2 text-sm text-[#403A32]/75">
                {asc.ok && asc.phaseDeg != null
                  ? `Degrees into phase: ${asc.phaseDeg.toFixed(2)}° / 45° (Asc-Year)`
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
                  Uses Progressed Sun (authoritative for Profile).
                </div>
              </SubCard>

              <SubCard title="Shift">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {asc.ok ? asc.shiftText : "—"}
                </div>
                <div className="mt-1 text-sm text-[#403A32]/75">
                  Estimated Asc-Year phase boundary crossing (mean solar rate).
                </div>
              </SubCard>

              <SubCard title="Next">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {asc.ok ? asc.nextLabel : "—"}
                </div>
                <div className="mt-1 text-sm text-[#403A32]/75">
                  Next 45° segment (Asc-Year boundary).
                </div>
              </SubCard>
            </div>

            {/* PROGRESS */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                  90° Season Arc (Asc-Year)
                </div>
                <div className="mt-2 text-sm text-[#403A32]/75">
                  Progress within the current season (0–90°).
                </div>

                <ProgressBar
                  value={asc.seasonProgress}
                  labelLeft="0°"
                  labelRight="90°"
                  meta={
                    asc.ok && asc.seasonDay != null && asc.seasonDeg != null
                      ? `Day ${asc.seasonDay}/90 • ${asc.seasonDeg.toFixed(2)}° / 90°`
                      : "—"
                  }
                />
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                  Phase Boundary (Asc-Year)
                </div>
                <div className="mt-2 text-sm text-[#403A32]/75">
                  Remaining to next 45° boundary.
                </div>

                <ProgressBar
                  value={asc.ok ? 1 - asc.phaseProgress : 0}
                  labelLeft={
                    asc.ok && asc.remainingDeg != null ? `${asc.remainingDeg.toFixed(2)}°` : "—"
                  }
                  labelRight="0°"
                  meta={
                    asc.ok && asc.daysToBoundary != null ? `~${asc.daysToBoundary.toFixed(1)} days` : "—"
                  }
                />
              </div>
            </div>

            {/* FIGURE-8 */}
            <div className="mt-8">
              {cyclePosDeg != null ? (
                <AscYearFigure8 cyclePosDeg={cyclePosDeg} />
              ) : (
                <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-10 text-center text-sm text-[#403A32]/70">
                  Cycle position unavailable.
                </div>
              )}
            </div>

            {/* URA FOUNDATION (fed by Asc-Year phase + progressed Sun text) */}
            <div className="mt-4">
              <URAFoundationPanel
                solarPhaseId={foundationPhaseId}
                solarProgress01={foundationProgress01}
                sunText={foundationSunText}
                ontology={null}
              />
            </div>

            {/* ORISHA PHASE MODULE (Asc-Year) */}
            <div className="mt-4">
              <PhaseMicrocopyCard
                copy={phaseCopy}
                tone="linen"
                defaultExpanded={false}
                showJournal={true}
                showActionHint={true}
              />
            </div>

            {/* PHASE BRIEF */}
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
