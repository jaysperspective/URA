// src/app/profile/ui/ProfileClient.tsx
"use client";

import { useMemo } from "react";
import { logoutAction } from "../actions";

type AscYearCore = {
  ok?: boolean;
  ascYear?: {
    cyclePosition?: number; // degrees (0-360): Sun-from-ASC position
    season?: string; // Spring/Summer/Fall/Winter
    modality?: string; // Cardinal/Fixed/Mutable
    modalitySegment?: string; // optional label
    degreesIntoModality?: number; // 0-30
    boundariesLongitude?: Record<string, number>;
  };
  natal?: {
    ascendant?: number;
    mc?: number;
    bodies?: Record<string, { lon?: number }>;
  };
  asOf?: {
    bodies?: Record<string, { lon?: number }>;
  };
  input?: any;
  summary?: any;
  text?: string;
};

type LunationCore = {
  ok?: boolean;
  lunar?: {
    label?: string; // "LC-0 • LD-10 (Waxing Gibbous)" style in calendar route; lunation route may differ
    phaseName?: string;
    lunarDay?: number;
    lunarAgeDays?: number;
    phaseAngleDeg?: number;
  };
  lunation?: any;
};

const C = {
  wheat: "#B9B07B",
  olive: "#71744F",
  linen: "#D5C0A5",
  brown: "#6B4F3A",

  ink: "#1F241A",
  inkMuted: "rgba(31,36,26,0.72)",
  inkSoft: "rgba(31,36,26,0.55)",

  surface: "rgba(244,235,221,0.90)",
  surface2: "rgba(213,192,165,0.80)",
  border: "rgba(31,36,26,0.16)",
  divider: "rgba(31,36,26,0.14)",
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function norm360(x: number) {
  const v = ((x % 360) + 360) % 360;
  return v;
}

function angleToSign(lon: number) {
  const signs = [
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
  ];
  const x = norm360(lon);
  return signs[Math.floor(x / 30)] ?? "—";
}

function degMin(lon: number) {
  const x = norm360(lon);
  const d = Math.floor(x % 30);
  const m = Math.floor(((x % 1) * 60 + 60) % 60);
  return `${d}° ${angleToSign(x)} ${String(m).padStart(2, "0")}'`;
}

function ProgressBar({ value01 }: { value01: number }) {
  const w = `${Math.round(clamp01(value01) * 100)}%`;
  return (
    <div
      className="mt-3 w-full h-2 rounded-full overflow-hidden"
      style={{ background: "rgba(31,36,26,0.18)" }}
    >
      <div className="h-full" style={{ background: "rgba(31,36,26,0.55)", width: w }} />
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border px-5 py-4" style={{ background: C.surface, borderColor: C.border }}>
      <div
        className="text-xs tracking-widest"
        style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
      >
        {title}
      </div>
      {children}
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
        <div style={{ color: C.ink }} className="opacity-80">
          {icon}
        </div>
        <div style={{ color: C.ink }} className="text-sm font-medium">
          {left}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div style={{ color: C.inkMuted }} className="text-sm">
          {right}
        </div>
        <div style={{ color: C.inkSoft }} className="opacity-70">
          ›
        </div>
      </div>
    </div>
  );
}

/**
 * A “disc” for the Asc-Year: shows where the Sun is relative to ASC (0–360).
 * This is not the Moon disc — it’s a compass-like orb.
 */
function AscYearDisc({ cyclePositionDeg }: { cyclePositionDeg: number }) {
  const a = norm360(cyclePositionDeg);
  // rotate so 0° is “top”
  const rot = a - 90;

  return (
    <div className="relative mx-auto w-[220px] h-[220px]">
      <svg viewBox="0 0 220 220" className="w-full h-full">
        <defs>
          <radialGradient id="orb" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F7F0E4" />
            <stop offset="60%" stopColor="#E7D7C2" />
            <stop offset="100%" stopColor={C.linen} />
          </radialGradient>

          <filter id="softGlow2" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="110"
          cy="110"
          r="108"
          fill="rgba(244,235,221,0.55)"
          stroke="rgba(31,36,26,0.18)"
          strokeWidth="2"
        />

        <g filter="url(#softGlow2)">
          <circle cx="110" cy="110" r="92" fill="url(#orb)" />
          <circle cx="110" cy="110" r="92" fill="rgba(31,36,26,0.04)" />
        </g>

        {/* ring */}
        <circle
          cx="110"
          cy="110"
          r="100"
          fill="none"
          stroke="rgba(31,36,26,0.18)"
          strokeWidth="1.5"
        />

        {/* pointer */}
        <g transform={`rotate(${rot} 110 110)`}>
          <line x1="110" y1="110" x2="198" y2="110" stroke="rgba(31,36,26,0.55)" strokeWidth="2" />
          <circle cx="198" cy="110" r="6" fill="rgba(31,36,26,0.55)" />
        </g>
      </svg>

      <div className="sr-only">Asc-Year position: {a.toFixed(2)} degrees</div>
    </div>
  );
}

export default function ProfileClient({
  displayName,
  timezone,
  asOfDate,
  natalJson,
  ascYearJson,
  lunationJson,
}: {
  displayName: string;
  timezone: string;
  asOfDate: string | null;
  natalJson: any;
  ascYearJson: any;
  lunationJson: any;
}) {
  const ascCore: AscYearCore | null = useMemo(() => {
    if (!ascYearJson) return null;
    // ensureProfileCaches stores the full /api/asc-year wrapper json
    return ascYearJson as AscYearCore;
  }, [ascYearJson]);

  const lunaCore: LunationCore | null = useMemo(() => {
    if (!lunationJson) return null;
    return lunationJson as LunationCore;
  }, [lunationJson]);

  const ay = ascCore?.ascYear;
  const natalAsc = ascCore?.natal?.ascendant;
  const tSun = ascCore?.asOf?.bodies?.sun?.lon;

  const cyclePos = typeof ay?.cyclePosition === "number" ? norm360(ay.cyclePosition) : null;

  const heroTitle = useMemo(() => {
    const season = ay?.season || "—";
    const modality = ay?.modality || "—";
    return `${season} • ${modality}`;
  }, [ay?.season, ay?.modality]);

  const heroSub = useMemo(() => {
    const seg = ay?.modalitySegment ? ` (${ay.modalitySegment})` : "";
    const d = typeof ay?.degreesIntoModality === "number" ? ay.degreesIntoModality.toFixed(2) : "—";
    return `Degrees into modality: ${d}°${seg}`;
  }, [ay?.degreesIntoModality, ay?.modalitySegment]);

  const cycleProgress01 = cyclePos == null ? 0 : cyclePos / 360;
  const modalityProgress01 =
    typeof ay?.degreesIntoModality === "number" ? clamp01(ay.degreesIntoModality / 30) : 0;

  const lunarLabel =
    lunaCore?.lunar?.label ||
    (lunaCore?.lunar?.phaseName ? `(${lunaCore.lunar.phaseName})` : "—");

  const cardStyle: React.CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(244,235,221,0.92) 0%, rgba(213,192,165,0.84) 55%, rgba(185,176,123,0.55) 120%)",
    borderColor: C.border,
    boxShadow: "0 26px 90px rgba(31,36,26,0.18), 0 2px 0 rgba(255,255,255,0.35) inset",
  };

  const panelStyle: React.CSSProperties = {
    background: C.surface,
    borderColor: C.border,
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% 20%, rgba(213,192,165,0.45), rgba(31,36,26,0.92)), linear-gradient(180deg, rgba(113,116,79,0.35), rgba(31,36,26,0.95))",
      }}
    >
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm" style={{ color: "rgba(244,235,221,0.75)" }}>
              Profile
            </div>
            <div className="text-xl font-semibold" style={{ color: "rgba(244,235,221,0.95)" }}>
              {displayName}
            </div>
          </div>

          <form action={logoutAction}>
            <button
              className="px-4 py-2 rounded-full border text-sm"
              style={{
                background: "rgba(244,235,221,0.18)",
                borderColor: "rgba(244,235,221,0.22)",
                color: "rgba(244,235,221,0.92)",
              }}
            >
              Logout
            </button>
          </form>
        </div>

        {/* HERO */}
        <div className="rounded-3xl border px-6 py-7 text-center" style={cardStyle}>
          <div className="text-sm tracking-widest" style={{ color: C.inkSoft }}>
            CURRENT
          </div>

          <div className="text-4xl font-semibold tracking-tight mt-2" style={{ color: C.ink }}>
            {heroTitle}
          </div>

          <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
            {heroSub}
          </div>

          {/* CONTEXT PANELS */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <Panel title="ASC-YEAR CONTEXT">
              <div className="mt-2 text-sm" style={{ color: C.ink }}>
                Cycle position (Sun from ASC):{" "}
                <span className="font-semibold">
                  {cyclePos == null ? "—" : `${cyclePos.toFixed(2)}°`}
                </span>
              </div>

              <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
                Anchor: Natal ASC{" "}
                {typeof natalAsc === "number" ? `${natalAsc.toFixed(2)}° (${angleToSign(natalAsc)})` : "—"}
                {typeof tSun === "number"
                  ? ` • Transiting Sun ${tSun.toFixed(2)}° (${angleToSign(tSun)})`
                  : ""}
              </div>

              <ProgressBar value01={cycleProgress01} />

              <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
                Timezone: {timezone}
                {asOfDate ? ` • asOf: ${new Date(asOfDate).toLocaleString()}` : ""}
              </div>
            </Panel>

            <Panel title="MODALITY TRACK">
              <div className="mt-2 text-sm" style={{ color: C.ink }}>
                {ay?.modality ?? "—"}
                {ay?.modalitySegment ? (
                  <span style={{ color: C.inkMuted }}> ({ay.modalitySegment})</span>
                ) : null}
              </div>

              <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
                Degrees into modality:{" "}
                {typeof ay?.degreesIntoModality === "number"
                  ? `${ay.degreesIntoModality.toFixed(2)}° / 30°`
                  : "—"}
              </div>

              <ProgressBar value01={modalityProgress01} />

              <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
                Lunar overlay: {lunarLabel}
              </div>
            </Panel>
          </div>

          {/* ASC-YEAR DISC */}
          <div className="mt-7 flex justify-center">
            <AscYearDisc cyclePositionDeg={cyclePos ?? 0} />
          </div>

          <div className="mt-5 text-xs" style={{ color: C.inkMuted }}>
            {cyclePos == null ? "—" : `AY-${cyclePos.toFixed(2)}°`}
            <span style={{ color: C.inkSoft }}> • </span>
            {lunarLabel}
          </div>
        </div>

        {/* DETAILS (sun-focused) */}
        <div
          className="rounded-2xl border overflow-hidden mt-5"
          style={{ ...panelStyle, boxShadow: "0 10px 40px rgba(31,36,26,0.10)" }}
        >
          <div style={{ borderBottom: `1px solid ${C.divider}` }}>
            <Row
              left="Ascendant (Natal)"
              right={typeof natalAsc === "number" ? `${natalAsc.toFixed(2)}° • ${degMin(natalAsc)}` : "—"}
              icon="↑"
            />
          </div>

          <div style={{ borderBottom: `1px solid ${C.divider}` }}>
            <Row
              left="Transiting Sun"
              right={typeof tSun === "number" ? `${tSun.toFixed(2)}° • ${degMin(tSun)}` : "—"}
              icon="☉"
            />
          </div>

          <div style={{ borderBottom: `1px solid ${C.divider}` }}>
            <Row
              left="Sun-from-ASC (Cycle Position)"
              right={cyclePos == null ? "—" : `${cyclePos.toFixed(2)}°`}
              icon="⦿"
            />
          </div>

          <Row
            left="Season / Modality"
            right={`${ay?.season ?? "—"} • ${ay?.modality ?? "—"}`}
            icon="⌁"
          />
        </div>

        {/* (Optional later) boundaries / next-hit panel:
            We can add a “Next Boundary” calculator when we extend /api/core to return timestamps.
            For now, the profile stays clean + sun-forward.
        */}
      </div>
    </div>
  );
}
