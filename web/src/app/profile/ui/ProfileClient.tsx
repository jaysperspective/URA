// src/app/profile/ui/ProfileClient.tsx
"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

function PersonalLunationCard({
  phase,
  subPhase,
  subWithinDeg,
  separationDeg,
  progressedSun,
  progressedMoon,
  directive,
}: {
  phase: string | null;
  subPhase: string | null;
  subWithinDeg: number | null;
  separationDeg: number | null;
  progressedSun: string;
  progressedMoon: string;
  directive: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const phaseLabel = phase?.trim() || "—";
  const subPhaseLabel = subPhase?.trim() || "";
  const combinedLabel = subPhaseLabel ? `${phaseLabel} / ${subPhaseLabel}` : phaseLabel;

  const subProgress01 = typeof subWithinDeg === "number" ? clamp01(subWithinDeg / 15) : 0;
  const separationNorm = typeof separationDeg === "number" ? norm360(separationDeg) : null;

  // Dial rendering
  const cx = 60;
  const cy = 60;
  const r = 42;
  const sep = separationNorm ?? 0;
  const angle = -90 + sep;
  const rad = (Math.PI / 180) * angle;
  const x2 = cx + r * Math.cos(rad);
  const y2 = cy + r * Math.sin(rad);

  return (
    <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] overflow-hidden">
      {/* Collapsed header - always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-black/[0.02] transition"
      >
        <div className="flex-1">
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
            Personal Lunation
          </div>
          <div className="mt-2 text-lg font-semibold text-[#1F1B16]">
            {combinedLabel}
          </div>
          <div className="mt-1 text-sm text-[#403A32]/75">{directive}</div>
        </div>

        <div className="flex items-center gap-4">
          {/* Mini dial indicator */}
          <svg width="48" height="48" viewBox="0 0 120 120" className="opacity-70">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="8" />
            {typeof separationNorm === "number" && (
              <>
                <circle cx={cx} cy={cy} r="3" fill="rgba(140,131,119,0.9)" />
                <line
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(140,131,119,0.9)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>

          <div
            className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center text-[#403A32]/60"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-black/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Details */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-3">
                <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55">
                  Progressed Positions
                </div>
                <div className="mt-2 text-sm text-[#1F1B16]">
                  <div className="flex justify-between py-1">
                    <span className="text-[#403A32]/70">Sun</span>
                    <span className="font-medium">{progressedSun}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#403A32]/70">Moon</span>
                    <span className="font-medium">{progressedMoon}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-3">
                <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55">
                  Sub-phase progress (0-15)
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-[#403A32]/70 mb-1">
                    <span>0</span>
                    <span>15</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#8C8377]"
                      style={{ width: `${subProgress01 * 100}%` }}
                    />
                  </div>
                  {typeof subWithinDeg === "number" && (
                    <div className="mt-1 text-xs text-[#403A32]/60">
                      {subWithinDeg.toFixed(1)} / 15
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Larger dial */}
            <div className="flex flex-col items-center justify-center">
              <svg width="140" height="140" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="12" />
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="rgba(0,0,0,0.05)"
                  strokeWidth="12"
                  strokeDasharray="3 12"
                />

                {/* Cardinal markers */}
                <line x1="100" y1="20" x2="100" y2="35" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
                <line x1="180" y1="100" x2="165" y2="100" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
                <line x1="100" y1="180" x2="100" y2="165" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
                <line x1="20" y1="100" x2="35" y2="100" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />

                {/* Labels */}
                <text x="100" y="12" textAnchor="middle" fontSize="8" fill="rgba(64,58,50,0.5)" letterSpacing="1">NEW</text>
                <text x="188" y="103" textAnchor="middle" fontSize="8" fill="rgba(64,58,50,0.5)" letterSpacing="1">1Q</text>
                <text x="100" y="195" textAnchor="middle" fontSize="8" fill="rgba(64,58,50,0.5)" letterSpacing="1">FULL</text>
                <text x="12" y="103" textAnchor="middle" fontSize="8" fill="rgba(64,58,50,0.5)" letterSpacing="1">3Q</text>

                {/* Hand */}
                {typeof separationNorm === "number" && (
                  <>
                    <circle cx="100" cy="100" r="5" fill="rgba(140,131,119,0.95)" />
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + 70 * Math.cos((Math.PI / 180) * (-90 + separationNorm))}
                      y2={100 + 70 * Math.sin((Math.PI / 180) * (-90 + separationNorm))}
                      stroke="rgba(140,131,119,0.95)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={100 + 70 * Math.cos((Math.PI / 180) * (-90 + separationNorm))}
                      cy={100 + 70 * Math.sin((Math.PI / 180) * (-90 + separationNorm))}
                      r="5"
                      fill="rgba(140,131,119,0.95)"
                    />
                  </>
                )}
              </svg>
              <div className="mt-2 text-sm text-[#403A32]/70">
                {typeof separationNorm === "number" ? `${separationNorm.toFixed(1)} separation` : "—"}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/lunation"
              className="rounded-2xl bg-[#151515] text-[#F4EFE6] px-4 py-2 text-sm border border-[#E2D9CC]/25 hover:bg-[#1E1E1E]"
            >
              Open /lunation
            </Link>
          </div>
        </div>
      )}
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

// Handoff data from /sun page
type HandoffData = {
  from?: string;
  ts?: string;
  focus?: string;
  dominant?: "solar" | "lunar" | "transitional";
} | null;

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

  // Handoff from /sun page
  handoffFromSun?: HandoffData;
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

// Expand abbreviations to full sign names for /astrology inputs
const SIGN_EXPAND: Record<(typeof SIGNS)[number], string> = {
  Ari: "Aries",
  Tau: "Taurus",
  Gem: "Gemini",
  Can: "Cancer",
  Leo: "Leo",
  Vir: "Virgo",
  Lib: "Libra",
  Sco: "Scorpio",
  Sag: "Sagittarius",
  Cap: "Capricorn",
  Aqu: "Aquarius",
  Pis: "Pisces",
};

function expandAbbrevSign(signPos: string) {
  // "Cap 03° 46'" -> "Capricorn 03° 46'"
  const parts = (signPos || "").trim().split(/\s+/);
  if (!parts.length) return signPos;
  const head = parts[0] as (typeof SIGNS)[number];
  const full = SIGN_EXPAND[head];
  if (!full) return signPos;
  return [full, ...parts.slice(1)].join(" ");
}

export default function ProfileClient(props: Props) {
  const router = useRouter();

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

    handoffFromSun,
  } = props;

  const [showAllPlacements, setShowAllPlacements] = useState(false);
  const [showHandoffBanner, setShowHandoffBanner] = useState(!!handoffFromSun);

  // Daily Brief (LLM)
  const [briefLoading, setBriefLoading] = useState(false);
  const [brief, setBrief] = useState<BriefResp | null>(null);

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

  // Lunation-specific phase ID (derived from progressed sun-moon separation)
  const lunationPhaseId = useMemo((): PhaseId => {
    if (typeof lunationSeparationDeg !== "number") return 1 as PhaseId;
    const sep = norm360(lunationSeparationDeg);
    // Map 0-360 separation to 8 phases (45° each)
    const idx = Math.floor((sep + 22.5) / 45) % 8;
    return (idx + 1) as PhaseId;
  }, [lunationSeparationDeg]);

  const lunationCopy = useMemo(() => microcopyForPhase(lunationPhaseId), [lunationPhaseId]);

  const sunTextForFoundation = useMemo(() => {
    if (typeof currentSunLon === "number") return fmtSignPos(currentSunLon);
    if (typeof progressedSunLon === "number") return fmtSignPos(progressedSunLon);
    return "—";
  }, [currentSunLon, progressedSunLon]);

  const asOfLabelForFoundation = useMemo(() => fmtAsOfLabel(asOfISO, timezone), [asOfISO, timezone]);

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

  // ✅ Build placements to handoff to /astrology (full sign names, keep degrees)
  const natalPlacementsForAstrology = useMemo(() => {
    const out: string[] = [];
    const p = natalPlanets ?? {};

    const add = (label: string, lon: number | null | undefined) => {
      if (typeof lon !== "number" || !Number.isFinite(lon)) return;
      const signPos = expandAbbrevSign(fmtSignPos(lon));
      out.push(`${label} ${signPos}`);
    };

    add("Sun", typeof p.sun === "number" ? (p.sun as number) : null);
    add("Moon", typeof p.moon === "number" ? (p.moon as number) : null);
    add("Mercury", typeof p.mercury === "number" ? (p.mercury as number) : null);
    add("Venus", typeof p.venus === "number" ? (p.venus as number) : null);
    add("Mars", typeof p.mars === "number" ? (p.mars as number) : null);
    add("Jupiter", typeof p.jupiter === "number" ? (p.jupiter as number) : null);
    add("Saturn", typeof p.saturn === "number" ? (p.saturn as number) : null);
    add("Uranus", typeof p.uranus === "number" ? (p.uranus as number) : null);
    add("Neptune", typeof p.neptune === "number" ? (p.neptune as number) : null);
    add("Pluto", typeof p.pluto === "number" ? (p.pluto as number) : null);
    add("Chiron", typeof p.chiron === "number" ? (p.chiron as number) : null);

    // Nodes (stored as northNode / southNode in this component)
    add("North Node", typeof p.northNode === "number" ? (p.northNode as number) : null);
    add("South Node", typeof p.southNode === "number" ? (p.southNode as number) : null);

    // NOTE: ASC/MC are display-only right now; you can include them later if doctrine supports angles.
    // if (typeof natalAscLon === "number") out.unshift(`ASC ${expandAbbrevSign(fmtSignPos(natalAscLon))}`);
    // if (typeof natalMcLon === "number") out.unshift(`MC ${expandAbbrevSign(fmtSignPos(natalMcLon as number))}`);

    return out;
  }, [natalPlanets]);

  const sabian = useMemo(() => {
    if (typeof currentSunLon !== "number") return null;
    return sabianFromLon(currentSunLon);
  }, [currentSunLon]);

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

  async function generateDailyBrief() {
    setBriefLoading(true);
    setBrief(null);

    try {
      const payload = {
        version: "1.0" as const,
        dayKey,
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
    } catch (e: any) {
      setBrief({ ok: false, error: e?.message || "Daily Brief failed." });
    } finally {
      setBriefLoading(false);
    }
  }

  function openAstrologyWithNatal() {
    try {
      sessionStorage.setItem(
        "ura:natalPlacements",
        JSON.stringify({
          v: 1,
          createdAt: Date.now(),
          placements: natalPlacementsForAstrology,
        })
      );
    } catch {
      // ignore
    }
    router.push("/astrology?auto=natal");
  }

  return (
    <div className="mt-8">
      {/* HANDOFF BANNER - shown when arriving from /sun */}
      {showHandoffBanner && handoffFromSun && (
        <div className="mx-auto max-w-5xl mb-4">
          <div
            className="rounded-2xl border px-5 py-4 relative"
            style={{
              background: "linear-gradient(135deg, rgba(200,178,106,0.15) 0%, rgba(127,168,161,0.10) 100%)",
              borderColor: "rgba(200,178,106,0.35)",
            }}
          >
            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => setShowHandoffBanner(false)}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-xs hover:bg-white/10 transition"
              style={{ color: "var(--ura-text-muted)" }}
              aria-label="Dismiss banner"
            >
              ×
            </button>

            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(200,178,106,0.25)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ura-text-primary)" }}>
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--ura-text-primary)" }}>
                  Personal view loaded
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--ura-text-secondary)" }}>
                  Personal Frame · Ascendant Anchor
                </div>
                {handoffFromSun.dominant && (
                  <div className="mt-2 text-xs" style={{ color: "var(--ura-text-muted)" }}>
                    From /sun: {handoffFromSun.dominant} layer emphasized
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <div className="mt-1 text-sm text-[#F4EFE6]/90">Tap expand to view all planets.</div>

                  {/* ✅ UPDATED: deep link to astrology + writes natal placements to sessionStorage */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={openAstrologyWithNatal}
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs hover:bg-white/10"
                      style={{
                        borderColor: "rgba(226,217,204,0.28)",
                        color: "rgba(244,239,230,0.85)",
                      }}
                    >
                      Open in /astrology →
                    </button>
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
                      <div key={row.key} className="rounded-xl border border-[#E2D9CC]/10 bg-black/10 px-3 py-2">
                        <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/55">
                          {row.label}
                        </div>
                        <div className="mt-1 text-sm text-[#F4EFE6]/90 font-medium">{row.value}</div>
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

            {/* DAILY BRIEF */}
            <div className="mt-4 rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Daily Brief</div>
                  <div className="mt-2 text-lg font-semibold text-[#1F1B16]">Phase + Sun Degree</div>

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
                <div className="mt-3 text-sm text-[#403A32]/70">
                  {briefLoading ? "Generating your daily brief…" : "No brief yet. Click Generate."}
                </div>
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
                <div className="mt-2 text-sm text-[#403A32]/75">Progress within the current season.</div>

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

            {/* PERSONAL LUNATION */}
            <div className="mt-8">
              <PersonalLunationCard
                phase={lunationPhase ?? null}
                subPhase={lunationSubPhase ?? null}
                subWithinDeg={lunationSubWithinDeg ?? null}
                separationDeg={lunationSeparationDeg ?? null}
                progressedSun={progressedSun}
                progressedMoon={progressedMoon}
                directive={lunationCopy.oneLine}
              />
            </div>

            {/* TOP ROW */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <SubCard title="Current Zodiac (As-of Sun)">
                <div className="text-sm font-semibold text-[#1F1B16]">{currentZodiac}</div>
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
                    meta={typeof lunationSubWithinDeg === "number" ? `${lunationSubWithinDeg.toFixed(2)}° / 15°` : "—"}
                  />
                </div>
              </SubCard>

              <SubCard title="Modality (30° lens)">
                <div className="text-sm font-semibold text-[#1F1B16]">
                  {orientation.ok ? orientation.modalityText : "—"}
                </div>
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
                href="/sun"
                className="rounded-2xl bg-[#F4EFE6] text-[#151515] px-4 py-2 text-sm border border-black/15 hover:bg-[#EFE7DB]"
              >
                Go to /sun
              </Link>
            </div>

            <div className="mt-5 text-center text-xs text-[#403A32]/70">{asOfLine}</div>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
