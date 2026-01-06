// src/app/profile/ui/ProfileClient.tsx
"use client";

import Link from "next/link";
import React, { useMemo } from "react";

import PhaseMicrocopyCard from "@/components/PhaseMicrocopyCard";
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";
import URAFoundationPanel from "@/components/ura/URAFoundationPanel";

// ------------------------------
// angle helpers
// ------------------------------
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

function fmtSignPos(lon: number | null) {
  if (typeof lon !== "number" || !Number.isFinite(lon)) return "—";
  return `${signFromLon(lon)} ${fmtLon(lon)}`;
}

// ------------------------------
// UI building blocks
// ------------------------------
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

function SubCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="min-w-[112px]">
      <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/70">{k}</div>
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

  const a = 290; // x radius
  const b = 95; // y radius

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
            Cycle Waveform
          </div>
          <div className="text-xs text-[#403A32]/70">{pos.toFixed(2)}°</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <svg width={size} height={H} className="block">
            <line x1={0} y1={cy} x2={size} y2={cy} stroke="rgba(0,0,0,0.10)" strokeWidth="1" />
            <line x1={cx} y1={0} x2={cx} y2={H} stroke="rgba(0,0,0,0.10)" strokeWidth="1" />

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
              <text key={l.txt} x={l.x} y={l.y} textAnchor={l.anchor} style={labelStyle}>
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

// ------------------------------
// Props
// ------------------------------
type Props = {
  name: string;
  locationLine: string;
  timezone: string;
  asOfISO: string | null;

  // natal
  natalAscLon: number | null;
  natalSunLon: number | null;
  natalMoonLon: number | null;

  // as-of (transiting) sun
  currentSunLon: number | null;

  // progressed
  progressedSunLon: number | null;
  progressedMoonLon: number | null;

  // asc-year (from cached /api/asc-year output)
  ascYearCyclePosDeg: number | null;
  ascYearSeason: string | null;
  ascYearModality: string | null;
  ascYearDegreesIntoModality: number | null;
};

function phaseIdFromCyclePos45(cyclePosDeg: number): PhaseId {
  const pos = norm360(cyclePosDeg);
  const idx = Math.floor(pos / 45); // 0..7
  return (idx + 1) as PhaseId;
}

export default function ProfileClient(props: Props) {
  const {
    name,
    locationLine,
    timezone,
    asOfISO,

    natalAscLon,
    natalSunLon,
    natalMoonLon,

    currentSunLon,

    progressedSunLon,
    progressedMoonLon,

    ascYearCyclePosDeg,
    ascYearSeason,
    ascYearModality,
    ascYearDegreesIntoModality,
  } = props;

  const natalAsc = fmtSignPos(natalAscLon);
  const natalSun = fmtSignPos(natalSunLon);
  const natalMoon = fmtSignPos(natalMoonLon);

  const progressedSun = fmtSignPos(progressedSunLon);
  const progressedMoon = fmtSignPos(progressedMoonLon);

  const currentZodiac = useMemo(() => {
    if (typeof currentSunLon === "number") return fmtSignPos(currentSunLon);
    if (typeof progressedSunLon === "number") return fmtSignPos(progressedSunLon);
    return "—";
  }, [currentSunLon, progressedSunLon]);

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

  // ------------------------------
  // Asc-Year orientation (truth)
  // ------------------------------
  const orientation = useMemo(() => {
    const ok = typeof ascYearCyclePosDeg === "number" && Number.isFinite(ascYearCyclePosDeg);
    const cyclePos = ok ? norm360(ascYearCyclePosDeg!) : null;

    const seasonText = typeof ascYearSeason === "string" ? ascYearSeason : "—";
    const modalityText = typeof ascYearModality === "string" ? ascYearModality : "—";

    const withinSeason = ok ? (cyclePos! % 90) : null;
    const seasonProgress01 = withinSeason != null ? withinSeason / 90 : 0;

    const withinModality =
      typeof ascYearDegreesIntoModality === "number"
        ? ascYearDegreesIntoModality
        : withinSeason != null
          ? withinSeason % 30
          : null;

    const modalityProgress01 = withinModality != null ? withinModality / 30 : 0;

    // ✅ URA 8-phase derived from cycle position
    const uraPhaseId = ok ? phaseIdFromCyclePos45(cyclePos!) : null;
    const uraDegIntoPhase = ok ? (cyclePos! % 45) : null;
    const uraProgress01 = uraDegIntoPhase != null ? uraDegIntoPhase / 45 : null;

    return {
      ok,
      cyclePos,
      seasonText,
      modalityText,
      seasonProgress01,
      withinSeason,
      withinModality,
      modalityProgress01,
      uraPhaseId,
      uraDegIntoPhase,
      uraProgress01,
    };
  }, [ascYearCyclePosDeg, ascYearSeason, ascYearModality, ascYearDegreesIntoModality]);

  // ✅ Microcopy is only computed if we have a phase id
  const phaseCopy = useMemo(() => {
    if (!orientation.uraPhaseId) return null;
    return microcopyForPhase(orientation.uraPhaseId);
  }, [orientation.uraPhaseId]);

  // Foundation panel “Sun” line should use current as-of Sun (preferred)
  const sunTextForFoundation = useMemo(() => {
    if (typeof currentSunLon === "number") return fmtSignPos(currentSunLon);
    if (typeof progressedSunLon === "number") return fmtSignPos(progressedSunLon);
    return "—";
  }, [currentSunLon, progressedSunLon]);

  // Sanity check: cyclePos should equal wrap360(asOfSun - natalAsc)
  const ascMathCheck = useMemo(() => {
    if (
      typeof natalAscLon !== "number" ||
      typeof currentSunLon !== "number" ||
      typeof orientation.cyclePos !== "number"
    ) {
      return null;
    }
    const expected = norm360(currentSunLon - natalAscLon);
    const got = norm360(orientation.cyclePos);
    const diff = Math.abs(expected - got);
    const diffWrapped = Math.min(diff, 360 - diff);
    return {
      expected,
      got,
      diff: diffWrapped,
    };
  }, [natalAscLon, currentSunLon, orientation.cyclePos]);

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
              <div className="text-[#F4EFE6] text-lg font-semibold leading-tight">{name}</div>
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
                Orientation (Asc-Year)
              </div>

              <div className="mt-2 text-3xl font-semibold tracking-tight text-[#1F1B16] leading-tight">
                <div className="flex justify-center">
                  <div>{orientation.ok ? orientation.seasonText : "—"}</div>
                </div>

                {/* ✅ show Phase under Spring instead of Modality */}
                <div className="flex justify-center">
                  <div>
                    {orientation.ok && orientation.uraPhaseId
                      ? `Phase ${orientation.uraPhaseId}`
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-sm text-[#403A32]/75">
                {orientation.ok && typeof orientation.cyclePos === "number"
                  ? `Asc-Year cycle position: ${orientation.cyclePos.toFixed(2)}° (0–360)`
                  : "Cycle position unavailable."}
              </div>

              {ascMathCheck ? (
                <div className="mt-2 text-xs text-[#403A32]/70">
                  ASC math check: expected {ascMathCheck.expected.toFixed(2)}° • got{" "}
                  {ascMathCheck.got.toFixed(2)}° • Δ {ascMathCheck.diff.toFixed(4)}°
                </div>
              ) : null}
            </div>

            {/* TOP ROW */}
            <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
              <SubCard title="Current Zodiac (As-of Sun)">
                <div className="text-sm font-semibold text-[#1F1B16]">{currentZodiac}</div>
                <div className="mt-1 text-sm text-[#403A32]/75">
                  Uses as-of (transiting) Sun when available.
                </div>
              </SubCard>

              <SubCard title="Progressed Sun / Moon">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {progressedSun} • {progressedMoon}
                </div>
                <div className="mt-1 text-sm text-[#403A32]/75">
                  Pulled from <span className="font-mono">lunation.progressedSunLon/MoonLon</span>.
                </div>
              </SubCard>

              <SubCard title="URA Phase (45° lens)">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {orientation.uraPhaseId ? `Phase ${orientation.uraPhaseId}` : "—"}
                </div>
                <div className="mt-1 text-sm text-[#403A32]/75">
                  Derived from Asc-Year cycle position (8×45°).
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
                  value={orientation.seasonProgress01}
                  labelLeft="0°"
                  labelRight="90°"
                  meta={
                    orientation.ok && typeof orientation.withinSeason === "number"
                      ? `${orientation.withinSeason.toFixed(2)}° / 90°`
                      : "—"
                  }
                />
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                  30° Modality Segment
                </div>
                <div className="mt-2 text-sm text-[#403A32]/75">
                  Progress within the current modality segment (0–30°).
                </div>

                <ProgressBar
                  value={orientation.modalityProgress01}
                  labelLeft="0°"
                  labelRight="30°"
                  meta={
                    orientation.ok && typeof orientation.withinModality === "number"
                      ? `${orientation.withinModality.toFixed(2)}° / 30°`
                      : "—"
                  }
                />
              </div>
            </div>

            {/* FIGURE-8 */}
            <div className="mt-8">
              {typeof orientation.cyclePos === "number" ? (
                <AscYearFigure8 cyclePosDeg={orientation.cyclePos} />
              ) : (
                <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-10 text-center text-sm text-[#403A32]/70">
                  Cycle position unavailable.
                </div>
              )}
            </div>

            {/* URA FOUNDATION PANEL */}
            <div className="mt-4">
              <URAFoundationPanel
                // keep panel stable even if asc-year missing
                solarPhaseId={(orientation.uraPhaseId ?? 1) as any}
                solarProgress01={orientation.uraProgress01}
                sunText={sunTextForFoundation}
                ontology={null}
                asOfLabel={asOfISO ? new Date(asOfISO).toLocaleString() : undefined}
              />
            </div>

            {/* ✅ ORISHA PHASE MODULE (THIS IS WHERE THE GUARD GOES) */}
            <div className="mt-4">
              {phaseCopy ? (
                <PhaseMicrocopyCard
                  copy={phaseCopy}
                  tone="linen"
                  defaultExpanded={false}
                  showJournal={true}
                  showActionHint={true}
                />
              ) : (
                <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4 text-sm text-[#403A32]/70">
                  Waiting for Asc-Year cycle position…
                </div>
              )}
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
