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

const M = {
  moonstone: "#F8F4EE",
  ink: "rgba(18,22,32,0.92)",
  inkMuted: "rgba(18,22,32,0.70)",
  inkSoft: "rgba(18,22,32,0.52)",
  borderSoft: "rgba(255,255,255,0.10)",
  shadow: "0 26px 90px rgba(0,0,0,0.45)",
};

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

function lunarURAPhaseId(params: { phaseAngleDeg?: number; phaseName?: string }): PhaseId {
  const aRaw =
    typeof params.phaseAngleDeg === "number"
      ? normalizeAngle0to360(params.phaseAngleDeg)
      : inferPhaseAngleDeg(params.phaseName);

  const a = normalizeAngle0to360(aRaw);
  const idx = Math.floor((a + 22.5) / 45) % 8;
  return (idx + 1) as PhaseId;
}

const MOON_PHASES_8: Array<{ id: PhaseId; name: string; glyph: string; boundaryDeg: number }> = [
  { id: 1, name: "New Moon", glyph: "◯", boundaryDeg: 0 },
  { id: 2, name: "Waxing Crescent", glyph: "◔", boundaryDeg: 45 },
  { id: 3, name: "First Quarter", glyph: "◐", boundaryDeg: 90 },
  { id: 4, name: "Waxing Gibbous", glyph: "◕", boundaryDeg: 135 },
  { id: 5, name: "Full Moon", glyph: "●", boundaryDeg: 180 },
  { id: 6, name: "Waning Gibbous", glyph: "◖", boundaryDeg: 225 },
  { id: 7, name: "Last Quarter", glyph: "◑", boundaryDeg: 270 },
  { id: 8, name: "Waning Crescent", glyph: "◗", boundaryDeg: 315 },
];

function MoonDisc({ phaseName, phaseAngleDeg }: { phaseName: string; phaseAngleDeg?: number }) {
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
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F4EEE6" />
            <stop offset="100%" stopColor="#E7DDD1" />
          </radialGradient>

          <radialGradient id="moonShadowMoonPage" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(10,14,24,0.45)" />
            <stop offset="100%" stopColor="rgba(10,14,24,0.92)" />
          </radialGradient>

          <clipPath id="moonClipMoonPage">
            <circle cx="110" cy="110" r="100" />
          </clipPath>

          <filter id="moonGlowMoonPage" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
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
          fill="rgba(255,255,255,0.10)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="2"
        />

        <g clipPath="url(#moonClipMoonPage)" filter="url(#moonGlowMoonPage)">
          <circle cx="110" cy="110" r={r} fill="url(#moonSurfaceMoonPage)" />

          <g opacity="0.12">
            <circle cx="78" cy="88" r="10" fill="rgba(40,44,60,0.35)" />
            <circle cx="145" cy="78" r="7" fill="rgba(40,44,60,0.30)" />
            <circle cx="125" cy="135" r="12" fill="rgba(40,44,60,0.28)" />
            <circle cx="92" cy="140" r="6" fill="rgba(40,44,60,0.30)" />
            <circle cx="160" cy="120" r="5" fill="rgba(40,44,60,0.30)" />
          </g>

          <circle cx={110 + dx} cy="110" r={r} fill="url(#moonShadowMoonPage)" />
          <circle cx={110 + dx * 0.92} cy="110" r={r} fill="rgba(10,14,24,0.06)" />
        </g>

        <circle
          cx="110"
          cy="110"
          r="100"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.5"
        />
      </svg>

      <div className="sr-only">{phaseName}</div>
    </div>
  );
}

function normalizeCalendarPayload(raw: any): CalendarAPI | null {
  if (!raw || typeof raw !== "object") return null;

  // allow: {ok:true, ...fields} OR {ok:true, data:{...}} OR {ok:true, calendar:{...}}
  const candidate = raw?.gregorian ? raw : raw?.data?.gregorian ? raw.data : raw?.calendar?.gregorian ? raw.calendar : null;
  if (!candidate) return null;

  // require minimum fields we render a lot
  if (!candidate?.gregorian?.ymd || !candidate?.gregorian?.asOfLocal) return null;
  if (!candidate?.lunar?.phaseName) return null;

  return candidate as CalendarAPI;
}

async function fetchJsonLoose(url: string): Promise<{ ok: true; json: any } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "fetch failed" };
  }

  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Non-JSON response" };
  }

  if (!res.ok) return { ok: false, error: parsed?.error ?? `HTTP ${res.status}` };
  if (parsed?.ok === false) return { ok: false, error: parsed?.error ?? "ok:false" };

  return { ok: true, json: parsed };
}

export default function MoonClient() {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<CalendarAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(targetYmd?: string) {
    setLoading(true);
    setError(null);
    try {
      const url = targetYmd ? `/api/calendar?ymd=${encodeURIComponent(targetYmd)}` : "/api/calendar";
      const r = await fetchJsonLoose(url);

      if (!r.ok) {
        setData(null);
        setError(r.error);
        return;
      }

      const normalized = normalizeCalendarPayload(r.json);
      if (!normalized) {
        setData(null);
        setError("Malformed /api/calendar payload (missing expected fields).");
        return;
      }

      setData(normalized);
      setYmd(normalized.gregorian.ymd);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function nav(deltaDays: number) {
    if (!ymd) return;
    const parts = ymd.split("-").map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return;

    const [yy, mm, dd] = parts;
    const d = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
    d.setUTCDate(d.getUTCDate() + deltaDays);

    const next = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate()
    ).padStart(2, "0")}`;

    load(next).catch(() => {});
  }

  const lunarPhaseId = useMemo(
    () =>
      lunarURAPhaseId({
        phaseAngleDeg: data?.lunar?.phaseAngleDeg,
        phaseName: data?.lunar?.phaseName,
      }),
    [data?.lunar?.phaseAngleDeg, data?.lunar?.phaseName]
  );

  const lunarCopy = useMemo(() => microcopyForPhase(lunarPhaseId), [lunarPhaseId]);

  const cardStyle: CSSProperties = {
    background:
      "linear-gradient(180deg, rgba(248,244,238,0.96) 0%, rgba(239,231,221,0.92) 55%, rgba(231,221,209,0.90) 120%)",
    borderColor: M.borderSoft,
    boxShadow: M.shadow,
  };

  const panelStyle: CSSProperties = {
    background: "rgba(248,244,238,0.86)",
    borderColor: "rgba(18,22,32,0.12)",
  };

  const currentMoonPhaseName =
    MOON_PHASES_8.find((p) => p.id === lunarPhaseId)?.name ?? (data?.lunar?.phaseName ?? "—");

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border px-6 py-7 text-center" style={cardStyle}>
        <div className="text-sm tracking-widest" style={{ color: M.inkSoft }}>
          MOON CYCLE
        </div>

        {error ? (
          <div
            className="mt-3 mx-auto max-w-[560px] rounded-2xl border px-4 py-3 text-left text-sm"
            style={{
              borderColor: "rgba(18,22,32,0.14)",
              background: "rgba(255,255,255,0.55)",
              color: M.ink,
            }}
          >
            <div className="font-semibold">Moon data unavailable</div>
            <div style={{ color: M.inkMuted }}>{error}</div>
          </div>
        ) : null}

        <div className="mt-5 flex justify-center">
          <MoonDisc phaseName={data?.lunar?.phaseName ?? "—"} phaseAngleDeg={data?.lunar?.phaseAngleDeg} />
        </div>

        <div className="text-4xl font-semibold tracking-tight mt-3" style={{ color: M.ink }}>
          {data?.lunar?.phaseName ?? "—"}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <div
            className="rounded-full border px-3 py-1 text-xs"
            style={{
              background: "rgba(255,255,255,0.55)",
              borderColor: "rgba(18,22,32,0.16)",
              color: M.ink,
            }}
            title={`${lunarCopy.header} • ${currentMoonPhaseName}`}
          >
            Lunar URA: <span className="font-semibold">Phase {lunarPhaseId}</span>
          </div>

          <div
            className="rounded-full border px-3 py-1 text-xs"
            style={{
              background: "rgba(255,255,255,0.40)",
              borderColor: "rgba(18,22,32,0.14)",
              color: M.inkMuted,
            }}
            title="Solar URA (main clock)"
          >
            Solar URA: <span className="font-semibold">{data?.solar?.phase ?? "—"}</span>
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <div
            className="rounded-2xl border px-5 py-3 text-sm text-left"
            style={{
              background: "rgba(255,255,255,0.55)",
              borderColor: "rgba(18,22,32,0.14)",
              color: M.ink,
              boxShadow: "0 10px 40px rgba(0,0,0,0.10)",
              minWidth: 280,
              maxWidth: 420,
            }}
          >
            <div>
              The Moon is in <span className="font-semibold">{data?.astro?.moonSign ?? "—"}</span>
            </div>
            <div className="mt-1 text-sm" style={{ color: M.inkMuted }}>
              As of{" "}
              <span style={{ color: M.ink }} className="opacity-85">
                {data?.gregorian?.asOfLocal ?? "—"}
              </span>
            </div>
            <div className="text-sm" style={{ color: M.inkMuted }}>
              Enters{" "}
              <span style={{ color: M.ink }} className="opacity-85">
                {data?.astro?.moonEntersSign ?? "—"}
              </span>{" "}
              <span style={{ color: M.ink }} className="opacity-85">
                {data?.astro?.moonEntersLocal ?? "—"}
              </span>
            </div>
            <div className="mt-2 text-xs" style={{ color: M.inkSoft }}>
              Lunar Day:{" "}
              <span style={{ color: M.inkMuted }}>{data?.lunar?.lunarDay ?? "—"}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 text-left">
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest text-center"
              style={{ color: M.ink, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              MOON PHASES
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {MOON_PHASES_8.map((p) => {
                const copy = microcopyForPhase(p.id);
                const isCurrent = p.id === lunarPhaseId;

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border px-4 py-4 text-center"
                    style={{
                      borderColor: isCurrent ? "rgba(18,22,32,0.22)" : "rgba(18,22,32,0.12)",
                      background: isCurrent ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.50)",
                      boxShadow: isCurrent ? "0 14px 40px rgba(0,0,0,0.12)" : undefined,
                    }}
                    title={`${p.name} • URA Phase ${p.id} • ${copy.orisha}`}
                  >
                    <div style={{ color: M.ink }} className="text-2xl opacity-90">
                      {p.glyph}
                    </div>

                    <div className="mt-2 text-xs" style={{ color: M.inkMuted }}>
                      {p.name}
                    </div>

                    <div className="mt-2 text-sm font-semibold" style={{ color: M.ink }}>
                      Phase {p.id} · {copy.orisha}
                    </div>

                    <div className="mt-2 text-xs" style={{ color: M.inkMuted }}>
                      {copy.oneLine}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-center" style={{ color: M.inkMuted }}>
              Lunar URA lens:{" "}
              <span style={{ color: M.ink, fontWeight: 700 }}>{lunarCopy.orisha}</span> —{" "}
              {lunarCopy.oneLine}
            </div>
          </div>
        </div>

        <div className="mt-4 text-left">
          <PhaseMicrocopyCard
            copy={lunarCopy}
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
              color: M.ink,
              borderColor: "rgba(18,22,32,0.14)",
              background: "rgba(255,255,255,0.55)",
            }}
          >
            ◀
          </button>

          <button
            onClick={() => load()}
            className="text-sm px-4 py-2 rounded-full border"
            style={{
              color: M.ink,
              borderColor: "rgba(18,22,32,0.14)",
              background: "rgba(255,255,255,0.55)",
            }}
          >
            ● Today
          </button>

          <button
            onClick={() => nav(1)}
            className="text-sm px-3 py-2 rounded-full border"
            style={{
              color: M.ink,
              borderColor: "rgba(18,22,32,0.14)",
              background: "rgba(255,255,255,0.55)",
            }}
          >
            ▶
          </button>
        </div>

        <div className="mt-5 text-xs" style={{ color: M.inkMuted }}>
          {loading ? "…" : data?.lunar?.label ?? ""}
          <span style={{ color: M.inkSoft }}> • </span>
          {data?.solar?.label ?? ""}
        </div>
      </div>
    </div>
  );
}
