// src/app/calendar/ui/CalendarClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import PhaseMicrocopyCard from "@/components/PhaseMicrocopyCard";
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";

type Marker = {
  kind: "New Moon" | "First Quarter" | "Full Moon" | "Last Quarter";
  whenLocal: string;
  degreeText: string;
  isoUTC: string;
};

type CalendarAPI = {
  ok: boolean;
  tz: string;
  gregorian: { ymd: string; asOfLocal: string };

  solar: {
    label: string;
    kind?: "PHASE" | "INTERPHASE";
    phase?: number; // legacy driver
    dayInPhase?: number;
    interphaseDay?: number;
    interphaseTotal?: number;
    dayIndexInYear?: number;
    yearLength?: number;
    anchors?: { equinoxLocalDay: string; nextEquinoxLocalDay: string };
  };

  lunar: {
    phaseName: string;
    label: string;
    lunarDay: number;
    lunarAgeDays?: number;
    synodicMonthDays?: number;
    phaseAngleDeg?: number;
  };

  astro: {
    sunPos: string;
    sunLon: number;
    nextSolar?: {
      nextBoundaryDeg: number;
      nextPhaseAtLocal: string;
      nextPhaseAtUTC: string;
    };
    moonPos: string;
    moonSign: string;
    moonEntersSign: string;
    moonEntersLocal: string;
  };

  lunation: { markers: Marker[] };
};

type UraContext = {
  ok: boolean;
  error?: string;
  asOfUTC?: string;
  astro?: { sunLon: number; moonLon: number };
  solar?: {
    phaseId: number; // 1..8
    phaseIndex0: number; // 0..7
    degIntoPhase: number; // 0..45
    progress01: number; // 0..1
    startDeg: number;
    endDeg: number;
  };
  ontology?: {
    id: number;
    title: string;
    function: string;
    ecology: string;
    psyche: string;
    orisha?: {
      key: string;
      modality: string;
      distortion: string;
      practice: string;
    };
    planet?: {
      key: string;
      force: string;
      distortion: string;
    };
  } | null;
};

// --- Palette (your moonstone / earth tone system) ---
const C = {
  wheat: "#B9B07B",
  olive: "#71744F",
  linen: "#D5C0A5",
  brown: "#6B4F3A",

  ink: "#1F241A",
  inkMuted: "rgba(31,36,26,0.72)",
  inkSoft: "rgba(31,36,26,0.55)",

  surface: "rgba(244,235,221,0.88)",
  border: "rgba(31,36,26,0.16)",
  divider: "rgba(31,36,26,0.14)",
};

function iconFor(kind: Marker["kind"]) {
  if (kind === "New Moon") return "◯";
  if (kind === "First Quarter") return "◐";
  if (kind === "Full Moon") return "●";
  return "◑";
}

function humanizeLunarLabel(label: string) {
  return label
    .replace(/\bLC-?(\d+)\b/g, "Full Lunar Cycle $1")
    .replace(/\bLD-?(\d+)\b/g, "Lunar Day $1");
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
  return SIGNS[Math.floor(norm360(lon) / 30) % 12];
}

/**
 * Moon disc rendering fix:
 * Fade shadow out as we approach Full so “Full” looks full.
 */
function MoonDisc({
  phaseName,
  phaseAngleDeg,
}: {
  phaseName: string;
  phaseAngleDeg?: number;
}) {
  const a = typeof phaseAngleDeg === "number" ? phaseAngleDeg : 180;

  // 0 = New, 180 = Full
  const rad = (a * Math.PI) / 180;

  // illumination fraction: 0 (New) -> 1 (Full)
  const illum = (1 - Math.cos(rad)) / 2;

  // shadow opacity: 1 at New -> 0 at Full
  const shadowOpacity = Math.max(0, Math.min(1, 1 - illum));

  const r = 92;
  const k = Math.cos(rad); // 1 at New, -1 at Full

  const dxMag = r * (1 - k);
  const waxing = a >= 0 && a <= 180;
  const dx = waxing ? -dxMag : dxMag;

  return (
    <div className="relative mx-auto w-[220px] h-[220px]">
      <svg viewBox="0 0 220 220" className="w-full h-full">
        <defs>
          <radialGradient id="moonSurface" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F7F0E4" />
            <stop offset="55%" stopColor="#E7D7C2" />
            <stop offset="100%" stopColor={C.linen} />
          </radialGradient>

          <radialGradient id="moonShadow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(31,36,26,0.55)" />
            <stop offset="100%" stopColor="rgba(31,36,26,0.88)" />
          </radialGradient>

          <clipPath id="moonClip">
            <circle cx="110" cy="110" r="100" />
          </clipPath>

          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
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

        <g clipPath="url(#moonClip)" filter="url(#softGlow)">
          <circle cx="110" cy="110" r={r} fill="url(#moonSurface)" />

          <g opacity="0.15">
            <circle cx="78" cy="88" r="10" fill="rgba(107,79,58,0.25)" />
            <circle cx="145" cy="78" r="7" fill="rgba(107,79,58,0.20)" />
            <circle cx="125" cy="135" r="12" fill="rgba(107,79,58,0.18)" />
            <circle cx="92" cy="140" r="6" fill="rgba(107,79,58,0.20)" />
            <circle cx="160" cy="120" r="5" fill="rgba(107,79,58,0.20)" />
          </g>

          <g opacity={shadowOpacity}>
            <circle cx={110 + dx} cy="110" r={r} fill="url(#moonShadow)" />
            <circle
              cx={110 + dx * 0.92}
              cy="110"
              r={r}
              fill="rgba(31,36,26,0.06)"
            />
          </g>
        </g>

        <circle
          cx="110"
          cy="110"
          r="100"
          fill="none"
          stroke="rgba(31,36,26,0.18)"
          strokeWidth="1.5"
        />
      </svg>

      <div className="sr-only">{phaseName}</div>
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

function ymdToUTCNoonISO(ymd: string) {
  const [yy, mm, dd] = ymd.split("-").map(Number);
  const d = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
  return d.toISOString();
}

function FoundationPanel({ ura }: { ura: UraContext | null }) {
  const o = ura?.ontology ?? null;
  if (!o) {
    return (
      <div className="mt-4 rounded-2xl border px-5 py-4" style={{ background: C.surface, borderColor: C.border }}>
        <div className="text-xs tracking-widest" style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}>
          URA FOUNDATION
        </div>
        <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
          Ontology unavailable for this day.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border px-5 py-4" style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs tracking-widest" style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}>
            URA FOUNDATION
          </div>
          <div className="mt-2 text-sm" style={{ color: C.ink }}>
            <span className="font-semibold">
              {o.function ?? "—"}
            </span>
            <span style={{ color: C.inkSoft }}> • </span>
            <span style={{ color: C.inkMuted }}>
              {o.title ?? "—"}
            </span>
          </div>
          <div className="mt-1 text-xs" style={{ color: C.inkSoft }}>
            {ura?.asOfUTC ? `As-of UTC: ${ura.asOfUTC.replace(".000Z", "Z")}` : ""}
          </div>
        </div>

        {typeof ura?.solar?.degIntoPhase === "number" ? (
          <div className="text-right">
            <div className="text-xs" style={{ color: C.inkMuted }}>
              Phase progress
            </div>
            <div className="mt-1 text-sm font-semibold" style={{ color: C.ink }}>
              {ura.solar.degIntoPhase.toFixed(2)}° / 45°
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border px-4 py-3" style={{ background: "rgba(244,235,221,0.70)", borderColor: "rgba(31,36,26,0.12)" }}>
          <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: C.inkSoft, fontWeight: 800 }}>
            Orisha Modality
          </div>
          <div className="mt-2 text-sm" style={{ color: C.ink }}>
            <span className="font-semibold">{o.orisha?.key ?? "—"}</span>{" "}
            <span style={{ color: C.inkSoft }}>—</span>{" "}
            <span style={{ color: C.inkMuted }}>{o.orisha?.modality ?? "—"}</span>
          </div>
          <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
            Distortion: {o.orisha?.distortion ?? "—"}
          </div>
          <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
            Practice: <span style={{ color: C.ink, fontWeight: 700 }}>{o.orisha?.practice ?? "—"}</span>
          </div>
        </div>

        <div className="rounded-2xl border px-4 py-3" style={{ background: "rgba(244,235,221,0.70)", borderColor: "rgba(31,36,26,0.12)" }}>
          <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: C.inkSoft, fontWeight: 800 }}>
            Planet Overlay
          </div>
          <div className="mt-2 text-sm" style={{ color: C.ink }}>
            <span className="font-semibold">{o.planet?.key ?? "—"}</span>{" "}
            <span style={{ color: C.inkSoft }}>—</span>{" "}
            <span style={{ color: C.inkMuted }}>{o.planet?.force ?? "—"}</span>
          </div>
          <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
            Distortion: {o.planet?.distortion ?? "—"}
          </div>
        </div>

        <div className="rounded-2xl border px-4 py-3 md:col-span-2" style={{ background: "rgba(244,235,221,0.70)", borderColor: "rgba(31,36,26,0.12)" }}>
          <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: C.inkSoft, fontWeight: 800 }}>
            Ecology • Psyche
          </div>
          <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
            <span style={{ color: C.ink, fontWeight: 800 }}>Ecology:</span>{" "}
            {o.ecology ?? "—"}
          </div>
          <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
            <span style={{ color: C.ink, fontWeight: 800 }}>Psyche:</span>{" "}
            {o.psyche ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarClient() {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<CalendarAPI | null>(null);
  const [ura, setUra] = useState<UraContext | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(targetYmd?: string) {
    setLoading(true);
    try {
      const url = targetYmd
        ? `/api/calendar?ymd=${encodeURIComponent(targetYmd)}`
        : "/api/calendar";
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as CalendarAPI;

      setData(json);
      setYmd(json.gregorian.ymd);

      const asOfISO = ymdToUTCNoonISO(json.gregorian.ymd);
      fetch(`/api/ura/context?asOf=${encodeURIComponent(asOfISO)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => setUra(j?.ok ? j : null))
        .catch(() => setUra(null));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function nav(deltaDays: number) {
    if (!ymd) return;

    const [yy, mm, dd] = ymd.split("-").map(Number);
    const d = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
    d.setUTCDate(d.getUTCDate() + deltaDays);

    const next = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getUTCDate()).padStart(2, "0")}`;

    load(next).catch(() => {});
  }

  const header = useMemo(() => {
    if (!data?.ok) return { top: "CURRENT", mid: "—" };
    return { top: "CURRENT", mid: data.lunar.phaseName };
  }, [data]);

  const calendarPhase = useMemo(() => {
    const p = data?.solar?.phase;
    return typeof p === "number" && p >= 1 && p <= 8 ? (p as PhaseId) : null;
  }, [data?.solar?.phase]);

  const uraPhase = useMemo(() => {
    const p = ura?.solar?.phaseId;
    return typeof p === "number" && p >= 1 && p <= 8 ? (p as PhaseId) : null;
  }, [ura?.solar?.phaseId]);

  const canonicalPhase: PhaseId = (uraPhase ?? calendarPhase ?? 1) as PhaseId;

  const phaseCopy = useMemo(() => microcopyForPhase(canonicalPhase), [canonicalPhase]);

  const sunSign = useMemo(() => {
    const lon =
      typeof ura?.astro?.sunLon === "number"
        ? ura.astro.sunLon
        : typeof data?.astro?.sunLon === "number"
        ? data.astro.sunLon
        : null;
    if (typeof lon === "number") return signFromLon(lon);
    return "—";
  }, [ura?.astro?.sunLon, data?.astro?.sunLon]);

  const mismatchNote = useMemo(() => {
    if (!uraPhase || !calendarPhase) return null;
    if (uraPhase === calendarPhase) return null;
    return `Driver mismatch: URA Solar Phase ${uraPhase} ≠ Calendar Phase ${calendarPhase}`;
  }, [uraPhase, calendarPhase]);

  const cardStyle: React.CSSProperties = {
    background:
      "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.95) 0%, rgba(185,176,123,0.55) 55%, rgba(113,116,79,0.45) 120%)",
    borderColor: C.border,
    boxShadow:
      "0 26px 90px rgba(31,36,26,0.18), 0 2px 0 rgba(255,255,255,0.35) inset",
  };

  const panelStyle: React.CSSProperties = {
    background: C.surface,
    borderColor: C.border,
  };

  const trackBg = "rgba(31,36,26,0.18)";
  const fillBg = "rgba(31,36,26,0.55)";

  const driverBadge = useMemo(() => {
    const label = uraPhase
      ? `URA Solar Phase ${uraPhase}`
      : calendarPhase
      ? `Calendar Phase ${calendarPhase}`
      : "—";
    return label;
  }, [uraPhase, calendarPhase]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border px-6 py-7 text-center" style={cardStyle}>
        <div className="text-sm tracking-widest" style={{ color: C.inkSoft }}>
          {header.top}
        </div>

        <div className="mt-4 flex justify-center">
          <MoonDisc
            phaseName={header.mid}
            phaseAngleDeg={data?.lunar?.phaseAngleDeg}
          />
        </div>

        <div
          className="text-4xl font-semibold tracking-tight mt-2"
          style={{ color: C.ink }}
        >
          {header.mid}
        </div>

        <div className="mt-3 flex justify-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
            style={{
              background: "rgba(244,235,221,0.70)",
              borderColor: "rgba(31,36,26,0.14)",
              color: C.inkMuted,
            }}
          >
            <span style={{ color: C.ink, fontWeight: 700 }}>Driver:</span>
            <span style={{ color: C.ink, fontWeight: 700 }}>{driverBadge}</span>
            {typeof ura?.solar?.degIntoPhase === "number" ? (
              <span style={{ color: C.inkMuted }}>
                • {ura.solar.degIntoPhase.toFixed(2)}° / 45°
              </span>
            ) : null}
          </div>
        </div>

        {mismatchNote ? (
          <div className="mt-2 text-xs" style={{ color: C.inkSoft }}>
            {mismatchNote}
          </div>
        ) : null}

        <div
          className="mt-4 mx-auto max-w-md rounded-2xl border px-4 py-3"
          style={{
            background: "rgba(244,235,221,0.82)",
            borderColor: "rgba(31,36,26,0.14)",
            boxShadow: "0 10px 35px rgba(31,36,26,0.10)",
          }}
        >
          <div className="text-base" style={{ color: C.ink }}>
            The Moon is in{" "}
            <span className="font-semibold" style={{ color: C.ink }}>
              {data?.astro.moonSign ?? "—"}
            </span>
          </div>

          <div className="mt-1 text-sm" style={{ color: C.inkMuted }}>
            As of{" "}
            <span style={{ color: C.ink }} className="opacity-85">
              {data?.gregorian.asOfLocal ?? "—"}
            </span>
          </div>

          <div className="mt-1 text-sm" style={{ color: C.inkMuted }}>
            Enters{" "}
            <span style={{ color: C.ink }} className="opacity-85">
              {data?.astro.moonEntersSign ?? "—"}
            </span>{" "}
            <span style={{ color: C.ink }} className="opacity-85">
              {data?.astro.moonEntersLocal ?? "—"}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest"
              style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              SOLAR CONTEXT ☉
            </div>

            {data?.solar?.kind === "INTERPHASE" ? (
              <div className="mt-2 text-sm" style={{ color: C.ink }}>
                Interphase • Day{" "}
                <span className="font-semibold">
                  {data?.solar?.interphaseDay ?? "—"}
                </span>{" "}
                of{" "}
                <span className="font-semibold">
                  {data?.solar?.interphaseTotal ?? "—"}
                </span>
              </div>
            ) : (
              <div className="mt-2 text-sm" style={{ color: C.ink }}>
                Phase <span className="font-semibold">{canonicalPhase}</span>{" "}
                of 8 • Day{" "}
                <span className="font-semibold">
                  {data?.solar?.dayInPhase ?? "—"}
                </span>{" "}
                of 45
              </div>
            )}

            <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
              Day {data?.solar?.dayIndexInYear ?? "—"} /{" "}
              {typeof data?.solar?.yearLength === "number"
                ? data.solar.yearLength - 1
                : "—"}
            </div>

            <div
              className="mt-3 w-full h-2 rounded-full overflow-hidden"
              style={{ background: trackBg }}
            >
              <div
                className="h-full"
                style={{
                  background: fillBg,
                  width:
                    typeof data?.solar?.dayIndexInYear === "number" &&
                    typeof data?.solar?.yearLength === "number"
                      ? `${Math.round(
                          ((data.solar.dayIndexInYear + 1) / data.solar.yearLength) * 100
                        )}%`
                      : "0%",
                }}
              />
            </div>

            <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
              Sun sign:{" "}
              <span style={{ color: C.ink, fontWeight: 700 }}>{sunSign}</span>
              {typeof ura?.astro?.sunLon === "number" ? (
                <span style={{ color: C.inkSoft }}> • (URA)</span>
              ) : (
                <span style={{ color: C.inkSoft }}> • (Calendar)</span>
              )}
            </div>

            {/* ✅ NEW: Foundation Panel inside Solar Context block */}
            <FoundationPanel ura={ura} />
          </div>

          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest"
              style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              LUNAR CONTEXT ☾
            </div>

            <div className="mt-2 text-sm" style={{ color: C.ink }}>
              {data?.lunar?.label ? humanizeLunarLabel(data.lunar.label) : "—"}
            </div>

            <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
              Age:{" "}
              {typeof data?.lunar?.lunarAgeDays === "number"
                ? `${data.lunar.lunarAgeDays.toFixed(2)} days`
                : "—"}{" "}
              • Lunar Day {data?.lunar?.lunarDay ?? "—"}
            </div>

            <div
              className="mt-3 w-full h-2 rounded-full overflow-hidden"
              style={{ background: trackBg }}
            >
              <div
                className="h-full"
                style={{
                  background: fillBg,
                  width:
                    typeof data?.lunar?.lunarAgeDays === "number" &&
                    typeof data?.lunar?.synodicMonthDays === "number"
                      ? `${Math.round(
                          (data.lunar.lunarAgeDays / data.lunar.synodicMonthDays) * 100
                        )}%`
                      : "0%",
                }}
              />
            </div>

            <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
              Moon: {data?.astro?.moonPos ?? "—"}
            </div>
          </div>
        </div>

        <div className="mt-5 text-left">
          <PhaseMicrocopyCard
            copy={phaseCopy}
            tone="linen"
            defaultExpanded={false}
            showJournal={true}
            showActionHint={true}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="text-sm px-3 py-2 rounded-full border"
            style={{
              color: C.ink,
              borderColor: C.border,
              background: "rgba(244,235,221,0.70)",
            }}
          >
            ◀
          </button>

          <button
            onClick={() => load()}
            className="text-sm px-4 py-2 rounded-full border"
            style={{
              color: C.ink,
              borderColor: C.border,
              background: "rgba(244,235,221,0.70)",
            }}
          >
            ● Today
          </button>

          <button
            onClick={() => nav(1)}
            className="text-sm px-3 py-2 rounded-full border"
            style={{
              color: C.ink,
              borderColor: C.border,
              background: "rgba(244,235,221,0.70)",
            }}
          >
            ▶
          </button>
        </div>

        <div className="mt-5 text-xs" style={{ color: C.inkMuted }}>
          {loading ? "…" : data?.solar.label ?? ""}
          <span style={{ color: C.inkSoft }}> • </span>
          {data?.lunar.label ?? ""}
        </div>
      </div>

      <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
        <div
          className="text-xs tracking-widest text-center"
          style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
        >
          MOON PHASE CYCLE
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {(data?.lunation.markers ?? []).map((m) => (
            <div key={m.kind} className="space-y-2">
              <div style={{ color: C.ink }} className="text-2xl opacity-80">
                {iconFor(m.kind)}
              </div>
              <div style={{ color: C.inkMuted }} className="text-xs">
                {m.kind}
              </div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">
                {m.degreeText}
              </div>
              <div style={{ color: C.inkMuted }} className="text-xs">
                {m.whenLocal}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          ...panelStyle,
          boxShadow: "0 10px 40px rgba(31,36,26,0.10)",
        }}
      >
        <div style={{ borderBottom: `1px solid ${C.divider}` }}>
          <Row left="Current Calendar" right={data?.solar.label ?? "—"} icon="⟐" />
        </div>

        <div style={{ borderBottom: `1px solid ${C.divider}` }}>
          <Row left="Sun" right={data?.astro.sunPos ?? "—"} icon="☉" />
        </div>

        <div style={{ borderBottom: `1px solid ${C.divider}` }}>
          <Row
            left="Sun Longitude (0–360°)"
            right={
              typeof (ura?.astro?.sunLon ?? data?.astro?.sunLon) === "number"
                ? `${(ura?.astro?.sunLon ?? data!.astro.sunLon).toFixed(2)}°`
                : "—"
            }
            icon="⦿"
          />
        </div>

        <Row
          left="Solar Progress"
          right={
            `URA Phase ${canonicalPhase}` +
            (typeof ura?.solar?.degIntoPhase === "number"
              ? ` • ${ura.solar.degIntoPhase.toFixed(2)}° / 45°`
              : data?.solar?.kind === "INTERPHASE"
              ? ` • Interphase Day ${data?.solar?.interphaseDay ?? "—"}`
              : ` • Day ${data?.solar?.dayInPhase ?? "—"}`
            )
          }
          icon="⌁"
        />
      </div>
    </div>
  );
}
