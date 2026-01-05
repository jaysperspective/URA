// src/app/moon/ui/MoonClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

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
    phase?: number;
    dayInPhase?: number;
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
    moonPos: string;
    moonSign: string;
    moonEntersSign: string;
    moonEntersLocal: string;
  };

  lunation: { markers: Marker[] };
};

// palette (same as /calendar for consistency)
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

function lunarURAPhaseId(params: {
  phaseAngleDeg?: number;
  phaseName?: string;
}): PhaseId {
  const aRaw =
    typeof params.phaseAngleDeg === "number"
      ? normalizeAngle0to360(params.phaseAngleDeg)
      : inferPhaseAngleDeg(params.phaseName);

  const a = normalizeAngle0to360(aRaw);
  const idx = Math.floor((a + 22.5) / 45) % 8;
  return (idx + 1) as PhaseId;
}

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
          <radialGradient id="moonSurfaceMoonPage" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F7F0E4" />
            <stop offset="55%" stopColor="#E7D7C2" />
            <stop offset="100%" stopColor={C.linen} />
          </radialGradient>

          <radialGradient id="moonShadowMoonPage" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(31,36,26,0.50)" />
            <stop offset="100%" stopColor="rgba(31,36,26,0.88)" />
          </radialGradient>

          <clipPath id="moonClipMoonPage">
            <circle cx="110" cy="110" r="100" />
          </clipPath>
        </defs>

        <circle
          cx="110"
          cy="110"
          r="108"
          fill="rgba(244,235,221,0.55)"
          stroke="rgba(31,36,26,0.18)"
          strokeWidth="2"
        />

        <g clipPath="url(#moonClipMoonPage)">
          <circle cx="110" cy="110" r={r} fill="url(#moonSurfaceMoonPage)" />
          <circle cx={110 + dx} cy="110" r={r} fill="url(#moonShadowMoonPage)" />
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

export default function MoonClient() {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<CalendarAPI | null>(null);
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

  const lunarPhaseId = useMemo(() => {
    return lunarURAPhaseId({
      phaseAngleDeg: data?.lunar?.phaseAngleDeg,
      phaseName: data?.lunar?.phaseName,
    });
  }, [data?.lunar?.phaseAngleDeg, data?.lunar?.phaseName]);

  const lunarCopy = useMemo(() => microcopyForPhase(lunarPhaseId), [lunarPhaseId]);

  const cardStyle: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(244,235,221,0.92) 0%, rgba(213,192,165,0.82) 55%, rgba(185,176,123,0.55) 120%)",
    borderColor: C.border,
    boxShadow:
      "0 26px 90px rgba(31,36,26,0.18), 0 2px 0 rgba(255,255,255,0.35) inset",
  };

  const panelStyle: CSSProperties = {
    background: C.surface,
    borderColor: C.border,
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border px-6 py-7 text-center" style={cardStyle}>
        <div className="text-sm tracking-widest" style={{ color: C.inkSoft }}>
          MOON CYCLE
        </div>

        <div className="mt-5 flex justify-center">
          <MoonDisc phaseName={data?.lunar?.phaseName ?? "—"} phaseAngleDeg={data?.lunar?.phaseAngleDeg} />
        </div>

        <div className="text-4xl font-semibold tracking-tight mt-3" style={{ color: C.ink }}>
          {data?.lunar?.phaseName ?? "—"}
        </div>

        {/* Lunar URA chip */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <div
            className="rounded-full border px-3 py-1 text-xs"
            style={{ background: "rgba(244,235,221,0.70)", borderColor: C.border, color: C.ink }}
            title={lunarCopy.header}
          >
            Lunar URA: <span className="font-semibold">Phase {lunarPhaseId}</span>
          </div>

          {/* Keep big clock present */}
          <div
            className="rounded-full border px-3 py-1 text-xs"
            style={{ background: "rgba(244,235,221,0.70)", borderColor: C.border, color: C.inkMuted }}
            title="Solar URA (main clock)"
          >
            Solar URA: <span className="font-semibold">{data?.solar?.phase ?? "—"}</span>
          </div>
        </div>

        {/* Moon sign box */}
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
              textAlign: "left",
            }}
          >
            <div style={{ color: C.ink }}>
              The Moon is in <span className="font-semibold">{data?.astro.moonSign ?? "—"}</span>
            </div>
            <div className="mt-1 text-sm" style={{ color: C.inkMuted }}>
              As of <span style={{ color: C.ink }} className="opacity-85">{data?.gregorian.asOfLocal ?? "—"}</span>
            </div>
            <div className="text-sm" style={{ color: C.inkMuted }}>
              Enters{" "}
              <span style={{ color: C.ink }} className="opacity-85">
                {data?.astro.moonEntersSign ?? "—"}
              </span>{" "}
              <span style={{ color: C.ink }} className="opacity-85">
                {data?.astro.moonEntersLocal ?? "—"}
              </span>
            </div>
            <div className="mt-2 text-xs" style={{ color: C.inkSoft }}>
              Lunar Day: <span style={{ color: C.inkMuted }}>{data?.lunar?.lunarDay ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Moon Phase Cycle */}
        <div className="mt-5 text-left">
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest text-center"
              style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              LUNATION MARKERS
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

        {/* Lunar microcopy (same ontology lens) */}
        <div className="mt-4 text-left">
          <PhaseMicrocopyCard
            copy={lunarCopy}
            tone="linen"
            defaultExpanded={false}
            showJournal={true}
            showActionHint={true}
          />
        </div>

        {/* Nav */}
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
          {loading ? "…" : data?.lunar.label ?? ""}
          <span style={{ color: C.inkSoft }}> • </span>
          {data?.solar.label ?? ""}
        </div>
      </div>

      {/* Quick read rows */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          ...panelStyle,
          boxShadow: "0 10px 40px rgba(31,36,26,0.10)",
        }}
      >
        <div style={{ borderBottom: `1px solid ${C.divider}` }}>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ color: C.ink }} className="opacity-80">☾</div>
              <div style={{ color: C.ink }} className="text-sm font-medium">Moon</div>
            </div>
            <div style={{ color: C.inkMuted }} className="text-sm">{data?.astro?.moonPos ?? "—"}</div>
          </div>
        </div>

        <div style={{ borderBottom: `1px solid ${C.divider}` }}>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ color: C.ink }} className="opacity-80">☉</div>
              <div style={{ color: C.ink }} className="text-sm font-medium">Sun</div>
            </div>
            <div style={{ color: C.inkMuted }} className="text-sm">{data?.astro?.sunPos ?? "—"}</div>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ color: C.ink }} className="opacity-80">⌁</div>
            <div style={{ color: C.ink }} className="text-sm font-medium">Lunar URA Phase</div>
          </div>
          <div style={{ color: C.inkMuted }} className="text-sm">
            Phase {lunarPhaseId} • {lunarCopy.orisha}
          </div>
        </div>
      </div>
    </div>
  );
}
