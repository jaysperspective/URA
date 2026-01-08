// src/app/profile/ui/ProfileClient.tsx
"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";
import URAFoundationPanel from "@/components/ura/URAFoundationPanel";

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"] as const;

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

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function ProgressBar({
  value,
  labelLeft,
  labelRight,
  meta,
}: {
  value: number;
  labelLeft: string;
  labelRight: string;
  meta?: string;
}) {
  const pct = clamp01(value) * 100;
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

function CardShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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

function AscYearFigure8({ cyclePosDeg }: { cyclePosDeg: number }) {
  const size = 760;
  const H = 260;
  const cx = size / 2;
  const cy = H / 2;

  const pos = norm360(cyclePosDeg);
  const t = (pos / 360) * Math.PI * 2;

  const a = 290;
  const b = 95;

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
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Cycle Waveform</div>
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

type NatalPlanets = {
  sun: number | null;
  moon: number | null;
  mercury: number | null;
  venus: number | null;
  mars: number | null;
  jupiter: number | null;
  saturn: number | null;
  uranus: number | null;
  neptune: number | null;
  pluto: number | null;
  chiron: number | null;
  northNode: number | null;
  southNode: number | null;
};

type Props = {
  name: string;
  locationLine: string;
  timezone: string;
  asOfISO: string | null;

  natalAscLon: number | null;
  natalMcLon?: number | null;

  natalSunLon: number | null;
  natalMoonLon: number | null;

  natalPlanets?: Partial<NatalPlanets> | null;

  currentSunLon: number | null;

  progressedSunLon: number | null;
  progressedMoonLon: number | null;

  // ✅ Lunation phase + subphase (from cached /api/lunation payload)
  lunationPhase?: string | null;
  lunationSubPhase?: string | null;
  lunationSubWithinDeg?: number | null;
  lunationSeparationDeg?: number | null;

  // cached values (fallback only)
  ascYearCyclePosDeg: number | null;
  ascYearSeason: string | null;
  ascYearModality: string | null;
  ascYearDegreesIntoModality: number | null;
};

function phaseIdFromCyclePos45(cyclePosDeg: number): PhaseId {
  const pos = norm360(cyclePosDeg);
  const idx = Math.floor(pos / 45);
  return (idx + 1) as PhaseId;
}

function seasonFromCyclePos(cyclePosDeg: number) {
  const pos = norm360(cyclePosDeg);
  const idx = Math.floor(pos / 90);
  return (["Spring", "Summer", "Fall", "Winter"][Math.max(0, Math.min(3, idx))] ?? "Spring") as
    | "Spring"
    | "Summer"
    | "Fall"
    | "Winter";
}

function modalityFromWithinSeason(withinSeasonDeg: number) {
  const idx = Math.floor(withinSeasonDeg / 30);
  return (["Cardinal", "Fixed", "Mutable"][Math.max(0, Math.min(2, idx))] ?? "Cardinal") as
    | "Cardinal"
    | "Fixed"
    | "Mutable";
}

function fmtAsOfLabel(asOfISO: string | null, tz: string) {
  if (!asOfISO) return undefined;
  const d = new Date(asOfISO);
  if (!Number.isFinite(d.getTime())) return undefined;

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function planetLabel(k: keyof NatalPlanets) {
  const map: Record<keyof NatalPlanets, string> = {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
    chiron: "Chiron",
    northNode: "North Node",
    southNode: "South Node",
  };
  return map[k];
}

export default function ProfileClient(props: Props) {
  const {
    name,
    locationLine,
    timezone,
    asOfISO,

    natalAscLon,
    natalMcLon,

    natalSunLon,
    natalMoonLon,

    natalPlanets,

    currentSunLon,

    progressedSunLon,
    progressedMoonLon,

    lunationPhase,
    lunationSubPhase,
    lunationSubWithinDeg,
    lunationSeparationDeg,

    ascYearCyclePosDeg,
    ascYearSeason,
    ascYearModality,
    ascYearDegreesIntoModality,
  } = props;

  const [showAllPlacements, setShowAllPlacements] = useState(false);
  const [showPhaseDetails, setShowPhaseDetails] = useState(false);

  const natalAsc = fmtSignPos(natalAscLon);
  const natalMc = fmtSignPos(typeof natalMcLon === "number" ? natalMcLon : null);
  const natalSun = fmtSignPos(natalSunLon);
  const natalMoon = fmtSignPos(natalMoonLon);

  const progressedSun = fmtSignPos(progressedSunLon);
  const progressedMoon = fmtSignPos(progressedMoonLon);

  const lunationLine = useMemo(() => {
    const p = lunationPhase?.trim() || "";
    const s = lunationSubPhase?.trim() || "";
    if (p && s) return `${p} • ${s}`;
    return p || s || "—";
  }, [lunationPhase, lunationSubPhase]);

  const subPhaseProgress01 = useMemo(() => {
    if (typeof lunationSubWithinDeg !== "number") return 0;
    // sub-phase is 15° buckets in your model
    return clamp01(lunationSubWithinDeg / 15);
  }, [lunationSubWithinDeg]);

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

  const cyclePosTruth = useMemo(() => {
    if (typeof natalAscLon === "number" && typeof currentSunLon === "number") {
      return norm360(currentSunLon - natalAscLon);
    }
    if (typeof ascYearCyclePosDeg === "number") return norm360(ascYearCyclePosDeg);
    return null;
  }, [natalAscLon, currentSunLon, ascYearCyclePosDeg]);

  const orientation = useMemo(() => {
    const ok = typeof cyclePosTruth === "number" && Number.isFinite(cyclePosTruth);
    const cyclePos = ok ? norm360(cyclePosTruth!) : null;

    const seasonText = ok ? seasonFromCyclePos(cyclePos!) : (ascYearSeason || "—");
    const withinSeason = ok ? (cyclePos! % 90) : null;
    const seasonProgress01 = withinSeason != null ? withinSeason / 90 : 0;

    const modalityText =
      ok && withinSeason != null ? modalityFromWithinSeason(withinSeason) : (ascYearModality || "—");

    const withinModality =
      ok && withinSeason != null
        ? withinSeason % 30
        : typeof ascYearDegreesIntoModality === "number"
        ? ascYearDegreesIntoModality
        : null;

    const modalityProgress01 = withinModality != null ? withinModality / 30 : 0;

    const uraPhaseId = ok ? phaseIdFromCyclePos45(cyclePos!) : (1 as PhaseId);
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
  }, [cyclePosTruth, ascYearSeason, ascYearModality, ascYearDegreesIntoModality]);

  const phaseCopy = useMemo(() => microcopyForPhase(orientation.uraPhaseId), [orientation.uraPhaseId]);

  const sunTextForFoundation = useMemo(() => {
    if (typeof currentSunLon === "number") return fmtSignPos(currentSunLon);
    if (typeof progressedSunLon === "number") return fmtSignPos(progressedSunLon);
    return "—";
  }, [currentSunLon, progressedSunLon]);

  const asOfLabelForFoundation = useMemo(() => fmtAsOfLabel(asOfISO, timezone), [asOfISO, timezone]);

  const ascMathCheck = useMemo(() => {
    if (typeof natalAscLon !== "number" || typeof currentSunLon !== "number" || typeof orientation.cyclePos !== "number") {
      return null;
    }
    const expected = norm360(currentSunLon - natalAscLon);
    const got = norm360(orientation.cyclePos);
    const diff = Math.abs(expected - got);
    const diffWrapped = Math.min(diff, 360 - diff);
    return { expected, got, diff: diffWrapped };
  }, [natalAscLon, currentSunLon, orientation.cyclePos]);

  const allNatalList = useMemo(() => {
    const p = natalPlanets ?? {};
    const keys: (keyof NatalPlanets)[] = [
      "sun",
      "moon",
      "mercury",
      "venus",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "pluto",
      "chiron",
      "northNode",
      "southNode",
    ];

    return keys.map((k) => ({
      key: k,
      label: planetLabel(k),
      value: fmtSignPos(typeof p[k] === "number" ? (p[k] as number) : null),
    }));
  }, [natalPlanets]);

  return (
    <div className="mt-8">
      {/* TOP STRIP */}
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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

          {/* placements module */}
          <div className="w-full md:w-auto md:min-w-[560px]">
            <div className="rounded-3xl border border-[#E2D9CC]/20 bg-black/20 backdrop-blur px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/60">
                    Natal placements
                  </div>
                  <div className="mt-1 text-sm text-[#F4EFE6]/90">
                    Tap expand to view all planets.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllPlacements((v) => !v)}
                  className="rounded-full border px-3 py-1.5 text-xs hover:bg-white/10"
                  style={{ borderColor: "rgba(226,217,204,0.28)", color: "rgba(244,239,230,0.85)" }}
                >
                  {showAllPlacements ? "Collapse" : "Expand"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-6">
                <Chip k="ASC" v={natalAsc} />
                <Chip k="MC" v={natalMc} />
                <Chip k="SUN" v={natalSun} />
                <Chip k="MOON" v={natalMoon} />
              </div>

              {showAllPlacements ? (
                <div className="mt-4 rounded-2xl border border-[#E2D9CC]/15 bg-black/15 px-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allNatalList.map((row) => (
                      <div
                        key={row.key}
                        className="rounded-xl border border-[#E2D9CC]/10 bg-black/10 px-3 py-2"
                      >
                        <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/55">
                          {row.label}
                        </div>
                        <div className="mt-1 text-sm text-[#F4EFE6]/90 font-medium">
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-[11px] text-[#F4EFE6]/55">
                    Note: Nodes/Chiron show when present in the cached natal chart.
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-6">
                <Chip k="SUN (PROG)" v={progressedSun} />
                <Chip k="MOON (PROG)" v={progressedMoon} />
                <Chip k="LUNATION" v={lunationLine} />
              </div>
            </div>
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
                <div className="flex justify-center">
                  <div>{orientation.ok ? `Phase ${orientation.uraPhaseId}` : "—"}</div>
                </div>
              </div>

              <div className="mt-2 text-sm text-[#403A32]/75">
                {orientation.ok && typeof orientation.cyclePos === "number"
                  ? `Asc-Year cycle position: ${orientation.cyclePos.toFixed(2)}° (0–360)`
                  : "Cycle position unavailable."}
              </div>

              {ascMathCheck ? (
                <div className="mt-2 text-xs text-[#403A32]/70">
                  ASC math check: expected {ascMathCheck.expected.toFixed(2)}° • got {ascMathCheck.got.toFixed(2)}° • Δ{" "}
                  {ascMathCheck.diff.toFixed(4)}°
                </div>
              ) : null}
            </div>

            {/* TOP ROW */}
            <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
              <SubCard title="Current Zodiac (As-of Sun)">
                <div className="text-sm font-semibold text-[#1F1B16]">{currentZodiac}</div>
                <div className="mt-1 text-sm text-[#403A32]/75">Uses as-of (transiting) Sun when available.</div>
              </SubCard>

              <SubCard title="Progressed Sun / Moon">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {progressedSun} • {progressedMoon}
                </div>
                <div className="mt-2 text-sm text-[#403A32]/75">
                  Lunation: <span className="font-semibold text-[#1F1B16]">{lunationLine}</span>
                  {typeof lunationSeparationDeg === "number" ? (
                    <span className="ml-2 text-xs text-[#403A32]/70">
                      (sep {norm360(lunationSeparationDeg).toFixed(2)}°)
                    </span>
                  ) : null}
                </div>

                <div className="mt-3">
                  <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/55">
                    Sub-phase progress (0–15°)
                  </div>
                  <ProgressBar
                    value={subPhaseProgress01}
                    labelLeft="0°"
                    labelRight="15°"
                    meta={
                      typeof lunationSubWithinDeg === "number"
                        ? `${lunationSubWithinDeg.toFixed(2)}° / 15°`
                        : "—"
                    }
                  />
                </div>
              </SubCard>

              <SubCard title="Modality (30° lens)">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {orientation.ok ? orientation.modalityText : "—"}
                </div>
                <div className="mt-1 text-sm text-[#403A32]/75">
                  Still tracked, but main header shows Phase.
                </div>
              </SubCard>
            </div>

            {/* PROGRESS */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">90° Season Arc</div>
                <div className="mt-2 text-sm text-[#403A32]/75">Progress within the current season (0–90°).</div>

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
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">30° Modality Segment</div>
                <div className="mt-2 text-sm text-[#403A32]/75">Progress within the current modality segment (0–30°).</div>

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

            {/* Phase lens (kept) */}
            <div className="mt-4">
              <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                      Phase lens
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[#1F1B16]">
                      {phaseCopy.header}
                    </div>
                    <div className="mt-1 text-sm text-[#403A32]/75">
                      {phaseCopy.oneLine}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPhaseDetails((v) => !v)}
                    className="rounded-full border px-3 py-1.5 text-xs hover:bg-black/5"
                    style={{ borderColor: "rgba(0,0,0,0.12)", color: "rgba(31,27,22,0.75)" }}
                  >
                    {showPhaseDetails ? "Hide" : "Details"}
                  </button>
                </div>

                {showPhaseDetails ? (
                  <div className="mt-4">
                    <div className="text-sm text-[#403A32]/80 leading-relaxed">
                      {phaseCopy.description}
                    </div>

                    {phaseCopy.actionHint ? (
                      <div className="mt-4 rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                        <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                          Action
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#1F1B16]">
                          {phaseCopy.actionHint}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                        Journal prompt
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[#1F1B16]">
                        {phaseCopy.journalPrompt}
                      </div>
                      <div className="mt-2 text-sm text-[#403A32]/75">
                        {phaseCopy.journalHelper}
                      </div>
                      <div className="mt-2 text-[11px] text-[#403A32]/60">
                        Journal off-app. This is the prompt only.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-[#403A32]/75">
                    <span className="font-semibold text-[#1F1B16]">Journal prompt:</span>{" "}
                    {phaseCopy.journalPrompt}
                  </div>
                )}

                <div className="mt-4 text-sm text-[#403A32]/65">
                  You are here in the cycle.
                </div>
              </div>
            </div>

            {/* Foundation panel */}
            <div className="mt-4">
              <URAFoundationPanel
                solarPhaseId={orientation.uraPhaseId}
                solarProgress01={orientation.uraProgress01}
                sunText={sunTextForFoundation}
                ontology={null}
                asOfLabel={asOfLabelForFoundation}
              />
            </div>

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
