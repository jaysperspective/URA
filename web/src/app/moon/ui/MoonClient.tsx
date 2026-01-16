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

function iconFor(kind: Marker["kind"]) {
  if (kind === "New Moon") return "◯";
  if (kind === "First Quarter") return "◐";
  if (kind === "Full Moon") return "●";
  return "◑";
}

function formatDateOnly(dateStr: string) {
  // Extract just the date part (YYYY-MM-DD) from timestamps
  const match = dateStr?.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    const [year, month, day] = match[1].split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
  }
  return dateStr ?? "—";
}

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
          {/* Realistic lunar surface gradient */}
          <radialGradient id="moonSurfaceMoonPage" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#E8E4DC" />
            <stop offset="30%" stopColor="#D8D2C8" />
            <stop offset="60%" stopColor="#C8C0B4" />
            <stop offset="100%" stopColor="#B8AFA0" />
          </radialGradient>

          {/* Maria (dark patches) gradient */}
          <radialGradient id="mariaDark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(80,75,68,0.5)" />
            <stop offset="100%" stopColor="rgba(80,75,68,0.2)" />
          </radialGradient>

          {/* Shadow gradient */}
          <radialGradient id="moonShadowMoonPage" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(15,18,25,0.5)" />
            <stop offset="60%" stopColor="rgba(10,12,18,0.85)" />
            <stop offset="100%" stopColor="rgba(5,8,12,0.95)" />
          </radialGradient>

          {/* Texture noise filter */}
          <filter id="moonTexture" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feColorMatrix type="saturate" values="0" result="mono" />
            <feComponentTransfer result="adjusted">
              <feFuncA type="linear" slope="0.08" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="adjusted" mode="overlay" />
          </filter>

          <clipPath id="moonClipMoonPage">
            <circle cx="110" cy="110" r={r} />
          </clipPath>

          {/* Subtle outer glow */}
          <filter id="moonGlowMoonPage" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer glow ring */}
        <circle
          cx="110"
          cy="110"
          r="100"
          fill="rgba(200,195,185,0.08)"
          stroke="rgba(180,175,165,0.15)"
          strokeWidth="1"
        />

        <g clipPath="url(#moonClipMoonPage)">
          {/* Base moon surface */}
          <circle cx="110" cy="110" r={r} fill="url(#moonSurfaceMoonPage)" />

          {/* Lunar maria (dark patches - like Mare Imbrium, Mare Serenitatis, etc.) */}
          <g opacity="0.4">
            {/* Mare Imbrium area */}
            <ellipse cx="85" cy="75" rx="28" ry="22" fill="rgba(70,65,58,0.45)" />
            {/* Mare Serenitatis */}
            <ellipse cx="130" cy="85" rx="18" ry="20" fill="rgba(75,70,62,0.4)" />
            {/* Mare Tranquillitatis */}
            <ellipse cx="145" cy="115" rx="22" ry="18" fill="rgba(72,68,60,0.35)" />
            {/* Oceanus Procellarum */}
            <ellipse cx="65" cy="110" rx="20" ry="30" fill="rgba(68,64,56,0.35)" />
            {/* Mare Nubium */}
            <ellipse cx="95" cy="150" rx="25" ry="15" fill="rgba(70,66,58,0.3)" />
          </g>

          {/* Craters with depth */}
          <g>
            {/* Tycho - prominent southern crater */}
            <circle cx="105" cy="170" r="8" fill="rgba(90,85,78,0.35)" />
            <circle cx="105" cy="170" r="6" fill="rgba(200,195,188,0.25)" />
            {/* Copernicus */}
            <circle cx="75" cy="105" r="7" fill="rgba(85,80,72,0.3)" />
            <circle cx="75" cy="105" r="5" fill="rgba(195,190,182,0.2)" />
            {/* Kepler */}
            <circle cx="55" cy="95" r="4" fill="rgba(88,82,75,0.35)" />
            {/* Aristarchus - bright crater */}
            <circle cx="48" cy="80" r="5" fill="rgba(220,215,205,0.3)" />
            {/* Plato */}
            <circle cx="95" cy="52" r="6" fill="rgba(65,60,55,0.4)" />
            {/* Grimaldi */}
            <circle cx="35" cy="115" r="5" fill="rgba(60,56,50,0.45)" />
            {/* Smaller craters scattered */}
            <circle cx="150" cy="70" r="3" fill="rgba(80,75,68,0.3)" />
            <circle cx="165" cy="100" r="4" fill="rgba(85,80,72,0.25)" />
            <circle cx="140" cy="145" r="3" fill="rgba(78,74,66,0.3)" />
            <circle cx="70" cy="140" r="3" fill="rgba(82,77,70,0.28)" />
            <circle cx="120" cy="60" r="3" fill="rgba(75,70,64,0.32)" />
            <circle cx="160" cy="130" r="2" fill="rgba(80,75,68,0.25)" />
            <circle cx="55" cy="145" r="2" fill="rgba(78,73,66,0.3)" />
          </g>

          {/* Subtle surface texture overlay */}
          <circle cx="110" cy="110" r={r} fill="url(#moonSurfaceMoonPage)" filter="url(#moonTexture)" opacity="0.6" />

          {/* Phase shadow */}
          <circle cx={110 + dx} cy="110" r={r + 2} fill="url(#moonShadowMoonPage)" />

          {/* Terminator softening (edge of shadow) */}
          <circle cx={110 + dx * 0.95} cy="110" r={r + 1} fill="rgba(15,18,25,0.15)" />
        </g>

        {/* Subtle rim highlight */}
        <circle
          cx="110"
          cy="110"
          r={r}
          fill="none"
          stroke="rgba(220,215,205,0.12)"
          strokeWidth="1"
        />
      </svg>

      <div className="sr-only">{phaseName}</div>
    </div>
  );
}

function normalizeCalendarPayload(raw: any): CalendarAPI | null {
  if (!raw || typeof raw !== "object") return null;

  const candidate = raw?.gregorian ? raw : raw?.data?.gregorian ? raw.data : raw?.calendar?.gregorian ? raw.calendar : null;
  if (!candidate) return null;

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

  const markers = data?.lunation?.markers ?? [];

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
              Lunar Day {data?.lunar?.lunarDay ?? "—"}
            </div>
          </div>
        </div>

        {/* ✅ Moved from Calendar: upcoming 4 key markers */}
        <div className="mt-5 text-left">
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest text-center"
              style={{ color: M.ink, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              MOON PHASE MARKERS
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {markers.map((m) => (
                <div key={m.kind} className="space-y-1">
                  <div style={{ color: M.ink }} className="text-2xl opacity-80">
                    {iconFor(m.kind)}
                  </div>
                  <div style={{ color: M.ink }} className="text-sm font-medium">
                    {m.kind}
                  </div>
                  <div style={{ color: M.inkMuted }} className="text-sm">
                    {formatDateOnly(m.whenLocal)}
                  </div>
                </div>
              ))}

              {!markers.length ? (
                <div className="col-span-2 md:col-span-4 text-center text-sm" style={{ color: M.inkMuted }}>
                  Moon phase markers unavailable.
                </div>
              ) : null}
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
              <span style={{ color: M.ink, fontWeight: 700 }}>{lunarCopy.orisha}</span> — {lunarCopy.oneLine}
            </div>
          </div>
        </div>

        <div className="mt-4 text-left">
          <PhaseMicrocopyCard copy={lunarCopy} tone="linen" defaultExpanded={false} showJournal={true} showActionHint={true} />
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
