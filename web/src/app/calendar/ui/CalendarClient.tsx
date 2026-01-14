// src/app/calendar/ui/CalendarClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import URAFoundationPanel from "@/components/ura/URAFoundationPanel";
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
    phase?: number;
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
    sunPos: string; // ex: "19° Cap 14'"
    sunLon: number; // 0..360
    nextSolar?: {
      nextBoundaryDeg: number;
      nextPhaseAtLocal: string;
      nextPhaseAtUTC: string;
    };
    moonPos: string; // ex: "10° Can 54'"
    moonSign: string;
    moonEntersSign: string;
    moonEntersSignLocal: string;
    moonEntersLocal: string;
  };

  lunation: { markers: Marker[] };
};

// --- Palette from reference (+ readability system) ---
const C = {
  wheat: "#B9B07B",
  olive: "#71744F",
  linen: "#D5C0A5",
  brown: "#6B4F3A",

  ink: "#1F241A",
  inkMuted: "rgba(31,36,26,0.72)",
  inkSoft: "rgba(31,36,26,0.55)",

  surface: "rgba(244,235,221,0.88)",
  surface2: "rgba(213,192,165,0.78)",
  border: "rgba(31,36,26,0.16)",
  divider: "rgba(31,36,26,0.14)",
};

function iconFor(kind: Marker["kind"]) {
  if (kind === "New Moon") return "◯";
  if (kind === "First Quarter") return "◐";
  if (kind === "Full Moon") return "●";
  return "◑";
}

function sunSignShortFromSunPos(sunPos?: string) {
  const m = sunPos?.match(/\b(Ari|Tau|Gem|Can|Leo|Vir|Lib|Sco|Sag|Cap|Aqu|Pis)\b/);
  return m?.[1] ?? "—";
}

function normalizeAngle0to360(a: number) {
  let x = a % 360;
  if (x < 0) x += 360;
  return x;
}

function inferPhaseAngleDeg(phaseName?: string) {
  const n = (phaseName ?? "").toLowerCase();
  if (n.includes("new")) return 0;
  if (n.includes("first quarter")) return 90;
  if (n.includes("full")) return 180;
  if (n.includes("last quarter")) return 270;

  if (n.includes("waxing crescent")) return 45;
  if (n.includes("waxing gibbous")) return 135;
  if (n.includes("waning gibbous")) return 225;
  if (n.includes("waning crescent")) return 315;

  return 120;
}

/**
 * Map lunar phase -> URA phase 1–8
 * 1 New Moon
 * 2 Waxing Crescent
 * 3 First Quarter
 * 4 Waxing Gibbous
 * 5 Full Moon
 * 6 Waning Gibbous
 * 7 Last Quarter
 * 8 Waning Crescent
 */
function lunarURAPhaseId(params: { phaseAngleDeg?: number; phaseName?: string }): PhaseId {
  const aRaw =
    typeof params.phaseAngleDeg === "number"
      ? normalizeAngle0to360(params.phaseAngleDeg)
      : inferPhaseAngleDeg(params.phaseName);

  const a = normalizeAngle0to360(aRaw);

  const idx = Math.floor((a + 22.5) / 45) % 8; // 0..7
  return (idx + 1) as PhaseId;
}

/**
 * MoonDisc rendering
 */
function MoonDisc({
  phaseName,
  phaseAngleDeg,
}: {
  phaseName: string;
  phaseAngleDeg?: number;
}) {
  const aRaw =
    typeof phaseAngleDeg === "number"
      ? normalizeAngle0to360(phaseAngleDeg)
      : inferPhaseAngleDeg(phaseName);

  const a = normalizeAngle0to360(aRaw);
  const rad = (a * Math.PI) / 180;

  const k = Math.cos(rad);
  const r = 92;
  const dxMag = r * (1 - k) * 1.08;
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
            <stop offset="0%" stopColor="rgba(31,36,26,0.50)" />
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

          <circle cx={110 + dx} cy="110" r={r} fill="url(#moonShadow)" />
          <circle cx={110 + dx * 0.92} cy="110" r={r} fill="rgba(31,36,26,0.05)" />
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

function Row({ left, right, icon }: { left: string; right: string; icon: string }) {
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

export default function CalendarClient() {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<CalendarAPI | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(targetYmd?: string) {
    setLoading(true);
    try {
      const url = targetYmd ? `/api/calendar?ymd=${encodeURIComponent(targetYmd)}` : "/api/calendar";
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as CalendarAPI;
      setData(json);
      setYmd(json.gregorian.ymd);
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

    const next = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate()
    ).padStart(2, "0")}`;

    load(next).catch(() => {});
  }

  const header = useMemo(() => {
    if (!data?.ok) return { top: "CURRENT", mid: "—" };
    return { top: "CURRENT", mid: data.lunar.phaseName };
  }, [data]);

  // Solar phase microcopy (still used for tooltips + chips only)
  const solarPhaseCopy = useMemo(() => {
    const p = data?.solar?.phase;
    if (typeof p === "number" && p >= 1 && p <= 8) return microcopyForPhase(p as PhaseId);
    return microcopyForPhase(1);
  }, [data?.solar?.phase]);

  const lunarPhaseId = useMemo(() => {
    return lunarURAPhaseId({
      phaseAngleDeg: data?.lunar?.phaseAngleDeg,
      phaseName: data?.lunar?.phaseName,
    });
  }, [data?.lunar?.phaseAngleDeg, data?.lunar?.phaseName]);

  const lunarPhaseCopy = useMemo(() => microcopyForPhase(lunarPhaseId), [lunarPhaseId]);

  const cardStyle: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(244,235,221,0.92) 0%, rgba(213,192,165,0.82) 55%, rgba(185,176,123,0.55) 120%)",
    borderColor: C.border,
    boxShadow: "0 26px 90px rgba(31,36,26,0.18), 0 2px 0 rgba(255,255,255,0.35) inset",
  };

  const panelStyle: CSSProperties = {
    background: C.surface,
    borderColor: C.border,
  };

  const trackBg = "rgba(31,36,26,0.18)";
  const fillBg = "rgba(31,36,26,0.55)";

  const sunSignShort = useMemo(() => sunSignShortFromSunPos(data?.astro?.sunPos), [data?.astro?.sunPos]);

  const solarPhaseId = typeof data?.solar?.phase === "number" ? data.solar.phase : null;

  const solarProgress01 =
    data?.solar?.kind === "INTERPHASE"
      ? typeof data?.solar?.interphaseDay === "number" &&
        typeof data?.solar?.interphaseTotal === "number" &&
        data.solar.interphaseTotal > 0
        ? data.solar.interphaseDay / data.solar.interphaseTotal
        : null
      : typeof data?.solar?.dayInPhase === "number"
      ? (data.solar.dayInPhase - 1) / 45
      : null;

  const sunText = data?.astro?.sunPos ?? "—";
  const ontology = null;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border px-6 py-7 text-center" style={cardStyle}>
        <div className="text-sm tracking-widest" style={{ color: C.inkSoft }}>
          {header.top}
        </div>

        <div className="mt-5 flex justify-center">
          <MoonDisc phaseName={header.mid} phaseAngleDeg={data?.lunar?.phaseAngleDeg} />
        </div>

        <div className="text-4xl font-semibold tracking-tight mt-3" style={{ color: C.ink }}>
          {header.mid}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <div
            className="rounded-full border px-3 py-1 text-xs"
            style={{ background: "rgba(244,235,221,0.70)", borderColor: C.border, color: C.ink }}
            title={solarPhaseCopy.header}
          >
            Solar URA: <span className="font-semibold">Phase {solarPhaseId ?? "—"}</span>
          </div>

          <div
            className="rounded-full border px-3 py-1 text-xs"
            style={{ background: "rgba(244,235,221,0.70)", borderColor: C.border, color: C.ink }}
            title={lunarPhaseCopy.header}
          >
            Lunar URA: <span className="font-semibold">Phase {lunarPhaseId}</span>
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <div
            className="rounded-2xl border px-5 py-3 text-sm"
            style={{
              background: "rgba(244,235,221,0.70)",
              borderColor: C.border,
              color: C.ink,
              boxShadow: "0 10px 40px rgba(31,36,26,0.08)",
              minWidth: 280,
              maxWidth: 420,
            }}
          >
            <div style={{ color: C.ink }}>
              The Moon is in <span className="font-semibold">{data?.astro?.moonSign ?? "—"}</span>
            </div>
            <div className="mt-1 text-sm" style={{ color: C.inkMuted }}>
              As of{" "}
              <span style={{ color: C.ink }} className="opacity-85">
                {data?.gregorian.asOfLocal ?? "—"}
              </span>
            </div>
            <div className="text-sm" style={{ color: C.inkMuted }}>
              Enters{" "}
              <span style={{ color: C.ink }} className="opacity-85">
                {data?.astro?.moonEntersSign ?? "—"}
              </span>{" "}
              <span style={{ color: C.ink }} className="opacity-85">
                {data?.astro?.moonEntersLocal ?? "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 text-left">
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
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest flex items-center gap-2"
              style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              SOLAR CONTEXT <span aria-hidden>☉</span>
            </div>

            {data?.solar?.kind === "INTERPHASE" ? (
              <div className="mt-2 text-sm" style={{ color: C.ink }}>
                Interphase • Day{" "}
                <span className="font-semibold">{data?.solar?.interphaseDay ?? "—"}</span> of{" "}
                <span className="font-semibold">{data?.solar?.interphaseTotal ?? "—"}</span>
              </div>
            ) : (
              <div className="mt-2 text-sm" style={{ color: C.ink }}>
                Phase <span className="font-semibold">{data?.solar?.phase ?? "—"}</span> of 8 • Day{" "}
                <span className="font-semibold">{data?.solar?.dayInPhase ?? "—"}</span> of 45
              </div>
            )}

            <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
              Day: {data?.solar?.dayIndexInYear ?? "—"} /{" "}
              {typeof data?.solar?.yearLength === "number" ? data.solar.yearLength - 1 : "—"}
            </div>

            <div className="mt-3 w-full h-2 rounded-full overflow-hidden" style={{ background: trackBg }}>
              <div
                className="h-full"
                style={{
                  background: fillBg,
                  width:
                    typeof data?.solar?.dayIndexInYear === "number" &&
                    typeof data?.solar?.yearLength === "number"
                      ? `${Math.round(((data.solar.dayIndexInYear + 1) / data.solar.yearLength) * 100)}%`
                      : "0%",
                }}
              />
            </div>

            <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
              Sun sign:{" "}
              <span style={{ color: C.ink }} className="font-semibold">
                {sunSignShort}
              </span>
              <span style={{ color: C.inkSoft }}> • </span>
              <span style={{ color: C.inkSoft }}>(URA)</span>
            </div>
          </div>

          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest flex items-center gap-2"
              style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              LUNAR CONTEXT <span aria-hidden>☾</span>
            </div>

            <div className="mt-2 text-sm" style={{ color: C.ink }}>
              Full Lunar Cycle <span className="font-semibold">0</span> • Lunar Day{" "}
              <span className="font-semibold">{data?.lunar?.lunarDay ?? "—"}</span> ({data?.lunar?.phaseName ?? "—"})
            </div>

            <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
              Age:{" "}
              {typeof data?.lunar?.lunarAgeDays === "number" ? `${data.lunar.lunarAgeDays.toFixed(2)} days` : "—"}{" "}
              <span style={{ color: C.inkSoft }}>•</span> Lunar Day {data?.lunar?.lunarDay ?? "—"}
            </div>

            <div className="mt-3 w-full h-2 rounded-full overflow-hidden" style={{ background: trackBg }}>
              <div
                className="h-full"
                style={{
                  background: fillBg,
                  width:
                    typeof data?.lunar?.lunarAgeDays === "number" &&
                    typeof data?.lunar?.synodicMonthDays === "number"
                      ? `${Math.round((data.lunar.lunarAgeDays / data.lunar.synodicMonthDays) * 100)}%`
                      : "0%",
                }}
              />
            </div>

            <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
              Moon: {data?.astro?.moonPos ?? "—"}
            </div>

            <div className="mt-2 text-xs" style={{ color: C.inkSoft }}>
              Lunar URA lens: <span style={{ color: C.inkMuted }}>{lunarPhaseCopy.oneLine}</span>
            </div>
          </div>
        </div>

        {/* ✅ Single source of truth: URA Foundation (PhaseMicrocopyCard removed) */}
        <div className="mt-4 text-left">
          <URAFoundationPanel
            solarPhaseId={solarPhaseId}
            solarProgress01={solarProgress01}
            sunText={sunText}
            ontology={ontology}
            asOfLabel={data?.gregorian?.asOfLocal ?? undefined}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="text-sm px-3 py-2 rounded-full border"
            style={{ color: C.ink, borderColor: C.border, background: "rgba(244,235,221,0.70)" }}
          >
            ◀
          </button>

          <button
            onClick={() => load()}
            className="text-sm px-4 py-2 rounded-full border"
            style={{ color: C.ink, borderColor: C.border, background: "rgba(244,235,221,0.70)" }}
          >
            ● Today
          </button>

          <button
            onClick={() => nav(1)}
            className="text-sm px-3 py-2 rounded-full border"
            style={{ color: C.ink, borderColor: C.border, background: "rgba(244,235,221,0.70)" }}
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
          <Row left="Sun" right={data?.astro?.sunPos ?? "—"} icon="☉" />
        </div>

        <div style={{ borderBottom: `1px solid ${C.divider}` }}>
          <Row
            left="Sun Longitude (0–360°)"
            right={typeof data?.astro?.sunLon === "number" ? `${data.astro.sunLon.toFixed(2)}°` : "—"}
            icon="⦿"
          />
        </div>

        <Row
          left="Solar Progress"
          right={
            data?.solar?.kind === "INTERPHASE"
              ? `Interphase Day ${data?.solar?.interphaseDay ?? "—"}`
              : `Phase ${data?.solar?.phase ?? "—"} • Day ${data?.solar?.dayInPhase ?? "—"}`
          }
          icon="⌁"
        />
      </div>
    </div>
  );
}
