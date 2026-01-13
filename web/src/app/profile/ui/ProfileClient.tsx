// src/app/profile/ui/ProfileClient.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";
import URAFoundationPanel from "@/components/ura/URAFoundationPanel";
import { sabianFromLon } from "@/lib/sabian";

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

/** small deterministic hash for daily micro-changes */
function hash01(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 0..1
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * ✅ Mobile-first Cycle Waveform + Visual micro-change
 * - no overflow-x scroll
 * - responsive svg
 * - subtle daily variation in stroke/glow (deterministic via dayKey + phase)
 */
function AscYearWaveform({
  cyclePosDeg,
  phaseId,
  dayKey,
}: {
  cyclePosDeg: number;
  phaseId: number;
  dayKey: string;
}) {
  const pos = norm360(cyclePosDeg);
  const t01 = pos / 360;

  // micro-change seed: day + phase
  const seed = useMemo(() => hash01(`${dayKey}::${phaseId}`), [dayKey, phaseId]);

  const pathD = useMemo(() => {
    const W = 1000;
    const mid = 60;
    const amp = 26;

    const samples = 64;
    let d = "";
    for (let i = 0; i <= samples; i++) {
      const x01 = i / samples;
      const x = x01 * W;

      const yNorm = Math.sin(x01 * Math.PI * 2); // -1..1
      const y = mid - yNorm * amp;

      d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }, []);

  const marker = useMemo(() => {
    const W = 1000;
    const mid = 60;
    const amp = 26;

    const x = t01 * W;
    const yNorm = Math.sin(t01 * Math.PI * 2);
    const y = mid - yNorm * amp;

    return { x, y };
  }, [t01]);

  // subtle variation knobs (no new colors, just alpha/width)
  const strokeAlpha = 0.48 + seed * 0.22; // ~0.48..0.70
  const strokeW = 5.2 + seed * 2.2; // ~5.2..7.4
  const glowAlpha = 0.08 + seed * 0.10; // ~0.08..0.18

  // slightly different marker “presence” each day
  const markerOuter = 12 + Math.round(seed * 6); // 12..18

  return (
    <div className="mx-auto w-full max-w-[820px]">
      <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Cycle Waveform</div>
          <div className="text-xs text-[#403A32]/70">{pos.toFixed(2)}°</div>
        </div>

        <div className="mt-4">
          <svg viewBox="0 0 1000 120" width="100%" height="96" className="block" role="img">
            {/* baseline */}
            <line x1="0" y1="60" x2="1000" y2="60" stroke="rgba(0,0,0,0.10)" strokeWidth="2" />

            {/* soft “glow” pass (micro-change) */}
            <path
              d={pathD}
              fill="none"
              stroke={`rgba(140,131,119,${glowAlpha.toFixed(3)})`}
              strokeWidth={Math.max(8, strokeW + 4)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* waveform */}
            <path
              d={pathD}
              fill="none"
              stroke={`rgba(0,0,0,${strokeAlpha.toFixed(3)})`}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* marker hairline */}
            <line x1={marker.x} y1="8" x2={marker.x} y2="112" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />

            {/* marker dot */}
            <circle cx={marker.x} cy={marker.y} r="8" fill="rgba(140,131,119,0.95)" />
            <circle cx={marker.x} cy={marker.y} r={markerOuter} fill="rgba(140,131,119,0.16)" />
          </svg>

          {/* anchors */}
          <div className="mt-2 grid grid-cols-4 text-[10px] tracking-[0.18em] uppercase text-[#403A32]/60">
            <div>SPRG</div>
            <div className="text-center">SUMR</div>
            <div className="text-center">FALL</div>
            <div className="text-right">WNTR</div>
          </div>
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

  lunationPhase?: string | null;
  lunationSubPhase?: string | null;
  lunationSubWithinDeg?: number | null;
  lunationSeparationDeg?: number | null;

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

type BriefOk = {
  ok: true;
  version: "1.0";
  output: {
    headline: string;
    meaning: string;
    do_now: string[];
    avoid: string[];
    journal: string;
    confidence: "low" | "medium" | "high";
    usedFields?: string[];
  };
  meta?: { model?: string };
};

type BriefErr = { ok: false; error: string; code?: string };
type BriefResp = BriefOk | BriefErr;

function getDayKeyInTZ(tz: string, d = new Date()) {
  try {
    // en-CA -> YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    const x = new Date();
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
}

/** Carry-over thread storage */
const CARRY_KEY = "ura.profile.carryOver.v1";
type CarryOver = {
  savedDayKey: string;
  headline?: string;
  journal?: string;
  sabianKey?: string;
  sabianSentence?: string;
};

function safeReadCarryOver(): CarryOver | null {
  try {
    const raw = localStorage.getItem(CARRY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as CarryOver;
  } catch {
    return null;
  }
}

function safeWriteCarryOver(v: CarryOver) {
  try {
    localStorage.setItem(CARRY_KEY, JSON.stringify(v));
  } catch {
    // ignore
  }
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

  // Daily Brief (LLM)
  const [briefLoading, setBriefLoading] = useState(false);
  const [brief, setBrief] = useState<BriefResp | null>(null);

  // Carry-over thread (yesterday)
  const [carryOver, setCarryOver] = useState<CarryOver | null>(null);

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

    const modalityText = ok && withinSeason != null ? modalityFromWithinSeason(withinSeason) : (ascYearModality || "—");

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

  // Sabian symbol anchor (Sun transiting degree)
  const sabian = useMemo(() => {
    if (typeof currentSunLon !== "number") return null;
    return sabianFromLon(currentSunLon);
  }, [currentSunLon]);

  // Prefer a real “symbol sentence”. If dataset still has placeholder text, fall back.
  const sabianSentence = useMemo(() => {
    if (!sabian) return null;
    const sym = (sabian.symbol ?? "").trim();
    const looksPlaceholder = /a moment in/i.test(sym) || /learning its/i.test(sym);
    if (sym && !looksPlaceholder && sym !== "—") return sym;

    const fallback =
      (sabian.signal ?? "").trim() ||
      (sabian.directive ?? "").trim() ||
      (sabian.practice ?? "").trim() ||
      "—";

    return fallback;
  }, [sabian]);

  const dayKey = useMemo(() => getDayKeyInTZ(timezone), [timezone]);

  // ✅ Load carry-over on mount + whenever dayKey changes
  useEffect(() => {
    try {
      const saved = safeReadCarryOver();
      if (!saved) {
        setCarryOver(null);
        return;
      }
      // only show if it's NOT today's entry
      if (saved.savedDayKey && saved.savedDayKey !== dayKey) setCarryOver(saved);
      else setCarryOver(null);
    } catch {
      setCarryOver(null);
    }
  }, [dayKey]);

  // ✅ Phase countdown (degrees remaining in 45° phase; “days” ~= degrees)
  const phaseCountdown = useMemo(() => {
    if (!orientation.ok || typeof orientation.uraDegIntoPhase !== "number") return null;
    const into = orientation.uraDegIntoPhase;
    const remaining = Math.max(0, 45 - into);
    const daysApprox = Math.max(0, Math.ceil(remaining)); // 1° ~ 1 day (approx)
    return {
      degRemaining: remaining,
      daysApprox,
    };
  }, [orientation.ok, orientation.uraDegIntoPhase]);

  async function generateDailyBrief() {
    setBriefLoading(true);
    setBrief(null);

    try {
      const payload = {
        version: "1.0" as const,

        // 👇 forces daily variation without changing ontology
        dayKey, // YYYY-MM-DD in user's tz

        context: {
          season: orientation.ok ? orientation.seasonText : (ascYearSeason || "—"),
          phaseId: orientation.uraPhaseId,
          cyclePosDeg: typeof orientation.cyclePos === "number" ? orientation.cyclePos : null,
          degIntoPhase: typeof orientation.uraDegIntoPhase === "number" ? orientation.uraDegIntoPhase : null,
          phaseProgress01: typeof orientation.uraProgress01 === "number" ? orientation.uraProgress01 : null,

          phaseHeader: phaseCopy.header,
          phaseOneLine: phaseCopy.oneLine,
          phaseDescription: phaseCopy.description,
          phaseActionHint: phaseCopy.actionHint ?? null,
          journalPrompt: phaseCopy.journalPrompt,
          journalHelper: phaseCopy.journalHelper,

          currentSun: currentZodiac,
          lunation: lunationLine,
          progressed: `${progressedSun} • ${progressedMoon}`,
          asOf: asOfLine,
        },

        sabian: sabian
          ? {
              idx: sabian.idx,
              key: sabian.key,
              sign: sabian.sign,
              degree: sabian.degree,
              symbol: sabian.symbol,
              signal: sabian.signal,
              shadow: sabian.shadow,
              directive: sabian.directive,
              practice: sabian.practice,
              journal: sabian.journal,
              tags: sabian.tags ?? [],
            }
          : null,

        output: { maxDoNow: 3, maxAvoid: 2, maxSentencesMeaning: 4 },
        constraints: { noPrediction: true, noNewClaims: true, citeInputs: true },
      };

      const r = await fetch("/api/profile/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = (await r.json()) as BriefResp;
      setBrief(data);

      // ✅ Save today as the next carry-over seed (so tomorrow has a thread)
      if (data && (data as any).ok) {
        const ok = data as BriefOk;
        safeWriteCarryOver({
          savedDayKey: dayKey,
          headline: ok.output.headline,
          journal: ok.output.journal,
          sabianKey: sabian?.key ?? undefined,
          sabianSentence: sabianSentence ?? undefined,
        });

        // once we generate today, hide carry-over (we are now “caught up”)
        setCarryOver(null);
      }
    } catch (e: any) {
      setBrief({ ok: false, error: e?.message || "Daily Brief failed." });
    } finally {
      setBriefLoading(false);
    }
  }

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
                  <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/60">Natal placements</div>
                  <div className="mt-1 text-sm text-[#F4EFE6]/90">Tap expand to view all planets.</div>
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
                      <div key={row.key} className="rounded-xl border border-[#E2D9CC]/10 bg-black/10 px-3 py-2">
                        <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/55">{row.label}</div>
                        <div className="mt-1 text-sm text-[#F4EFE6]/90 font-medium">{row.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-[11px] text-[#F4EFE6]/55">Note: Nodes/Chiron show when present in the cached natal chart.</div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-6">
                <Chip k="SUN (PROG)" v={fmtSignPos(progressedSunLon)} />
                <Chip k="MOON (PROG)" v={fmtSignPos(progressedMoonLon)} />
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
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Orientation (Asc-Year)</div>

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

            {/* ✅ Phase Countdown */}
            <div className="mt-4 rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Phase Countdown</div>
                  <div className="mt-2 text-sm text-[#403A32]/85">
                    {phaseCountdown ? (
                      <>
                        <span className="font-semibold text-[#1F1B16]">
                          {phaseCountdown.degRemaining.toFixed(2)}°
                        </span>{" "}
                        remaining in this 45° phase
                        <span className="mx-2">•</span>
                        ~{phaseCountdown.daysApprox} days (approx)
                      </>
                    ) : (
                      "Countdown unavailable."
                    )}
                  </div>
                </div>

                <div className="text-xs text-[#403A32]/65">
                  {orientation.ok && typeof orientation.uraDegIntoPhase === "number"
                    ? `${orientation.uraDegIntoPhase.toFixed(2)}° into Phase ${orientation.uraPhaseId}`
                    : "—"}
                </div>
              </div>
            </div>

            {/* ✅ Foundation panel moved ABOVE Daily Brief */}
            <div className="mt-4">
              <URAFoundationPanel
                solarPhaseId={orientation.uraPhaseId}
                solarProgress01={orientation.uraProgress01}
                sunText={sunTextForFoundation}
                ontology={null}
                asOfLabel={asOfLabelForFoundation}
              />
            </div>

            {/* ✅ Carry-Over Thread (yesterday) */}
            {carryOver ? (
              <div className="mt-4 rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-5">
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Carry-Over Thread</div>
                <div className="mt-2 text-sm text-[#403A32]/85">
                  <span className="text-xs text-[#403A32]/60">Saved from </span>
                  <span className="font-semibold text-[#1F1B16]">{carryOver.savedDayKey}</span>
                </div>

                {carryOver.headline ? (
                  <div className="mt-3">
                    <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Headline</div>
                    <div className="mt-1 text-sm font-semibold text-[#1F1B16]">{carryOver.headline}</div>
                  </div>
                ) : null}

                {carryOver.journal ? (
                  <div className="mt-3 rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                    <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Journal thread</div>
                    <div className="mt-2 text-sm font-semibold text-[#1F1B16]">{carryOver.journal}</div>
                  </div>
                ) : null}

                {carryOver.sabianKey && carryOver.sabianSentence ? (
                  <div className="mt-3 text-sm text-[#403A32]/85">
                    <span className="font-semibold text-[#1F1B16]">{carryOver.sabianKey}</span>
                    <span className="mx-2">•</span>
                    <span>{carryOver.sabianSentence}</span>
                  </div>
                ) : null}

                <div className="mt-3 text-xs text-[#403A32]/65">
                  Tip: generate today’s brief to “advance” the thread forward.
                </div>
              </div>
            ) : null}

            {/* DAILY BRIEF (after Foundation) */}
            <div className="mt-4 rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Daily Brief</div>
                  <div className="mt-2 text-lg font-semibold text-[#1F1B16]">Phase + Sun Degree </div>

                  <div className="mt-1 text-sm text-[#403A32]/85">
                    {sabian ? (
                      <>
                        <span className="font-semibold text-[#1F1B16]">{sabian.key}</span>
                        <span className="mx-2">•</span>
                        <span>{sabianSentence}</span>
                      </>
                    ) : (
                      "Sabian unavailable (missing current Sun)."
                    )}
                  </div>

                  <div className="mt-1 text-xs text-[#403A32]/65">Day key: {dayKey}</div>
                </div>

                <button
                  type="button"
                  onClick={generateDailyBrief}
                  disabled={briefLoading}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm border transition",
                    "bg-[#F4EFE6] text-[#1F1B16]",
                    "border-black/25 hover:bg-black/5",
                    briefLoading ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {briefLoading ? "Generating…" : brief ? "Refresh" : "Generate"}
                </button>
              </div>

              {brief && !brief.ok ? <div className="mt-3 text-sm text-red-700">{brief.error}</div> : null}

              {brief && brief.ok ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Headline</div>
                    <div className="mt-1 text-base font-semibold text-[#1F1B16]">{brief.output.headline}</div>
                  </div>

                  <div>
                    <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Meaning</div>
                    <div className="mt-1 text-sm text-[#403A32]/85 leading-relaxed">{brief.output.meaning}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Do now</div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-[#403A32]/85">
                        {(brief.output.do_now ?? []).map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Avoid</div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-[#403A32]/85">
                        {(brief.output.avoid ?? []).map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                    <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Journal</div>
                    <div className="mt-2 text-sm font-semibold text-[#1F1B16]">{brief.output.journal}</div>
                    <div className="mt-2 text-xs text-[#403A32]/65">Confidence: {brief.output.confidence}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-[#403A32]/70">{briefLoading ? "Generating your daily brief…" : "No brief yet. Click Generate."}</div>
              )}
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
                <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">45° Season Segment</div>
                <div className="mt-2 text-sm text-[#403A32]/75">Progress within the current season. </div>

                <ProgressBar
                  value={orientation.modalityProgress01}
                  labelLeft="0°"
                  labelRight="45°"
                  meta={
                    orientation.ok && typeof orientation.withinModality === "number"
                      ? `${orientation.withinModality.toFixed(2)}° / 45°`
                      : "—"
                  }
                />
              </div>
            </div>

            {/* ✅ CYCLE WAVEFORM (mobile-first) + micro-change */}
            <div className="mt-8">
              {typeof orientation.cyclePos === "number" ? (
                <AscYearWaveform cyclePosDeg={orientation.cyclePos} phaseId={orientation.uraPhaseId} dayKey={dayKey} />
              ) : (
                <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-10 text-center text-sm text-[#403A32]/70">
                  Cycle position unavailable.
                </div>
              )}
            </div>

            {/* TOP ROW */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <SubCard title="Current Zodiac (As-of Sun)">
                <div className="text-sm font-semibold text-[#1F1B16]">{currentZodiac}</div>
                <div className="mt-1 text-sm text-[#403A32]/75"></div>
              </SubCard>

              <SubCard title="Progressed Sun / Moon">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {progressedSun} • {progressedMoon}
                </div>
                <div className="mt-2 text-sm text-[#403A32]/75">
                  Lunation: <span className="font-semibold text-[#1F1B16]">{lunationLine}</span>
                  {typeof lunationSeparationDeg === "number" ? (
                    <span className="ml-2 text-xs text-[#403A32]/70">(sep {norm360(lunationSeparationDeg).toFixed(2)}°)</span>
                  ) : null}
                </div>

                <div className="mt-3">
                  <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/55">Sub-phase progress (0–15°)</div>
                  <ProgressBar
                    value={subPhaseProgress01}
                    labelLeft="0°"
                    labelRight="15°"
                    meta={typeof lunationSubWithinDeg === "number" ? `${lunationSubWithinDeg.toFixed(2)}° / 15°` : "—"}
                  />
                </div>
              </SubCard>

              <SubCard title="Modality (30° lens)">
                <div className="text-sm font-semibold text-[#1F1B16]">{orientation.ok ? orientation.modalityText : "—"}</div>
                <div className="mt-1 text-sm text-[#403A32]/75"></div>
              </SubCard>
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
