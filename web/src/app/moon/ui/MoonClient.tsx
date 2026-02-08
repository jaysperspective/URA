// src/app/moon/ui/MoonClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import PhaseMicrocopyCard from "@/components/PhaseMicrocopyCard";
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";
import FirstVisitIntroModal from "@/components/FirstVisitIntroModal";

type Synthesis = {
  headline: string;
  guidance: string;
  actionHint: string;
  journalPrompt: string;
  generatedAt: string;
  expiresAt: string;
};

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

  const size = 180; // Slightly smaller, tighter
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;

  const dxMag = r * (1 - k) * 1.05;
  const waxing = a >= 0 && a <= 180;
  const dx = waxing ? -dxMag : dxMag;

  // Illumination for subtle glow effect
  const illum = (1 - Math.cos(rad)) / 2;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(248,244,238,${0.08 + illum * 0.12}) 0%, transparent 70%)`,
          transform: "scale(1.15)",
        }}
      />

      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full relative">
        <defs>
          {/* Clean lunar surface gradient */}
          <radialGradient id="moonSurfaceClean" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F0EDE6" />
            <stop offset="40%" stopColor="#E4DFD6" />
            <stop offset="75%" stopColor="#D4CFC4" />
            <stop offset="100%" stopColor="#C8C2B6" />
          </radialGradient>

          {/* Shadow gradient - smoother */}
          <radialGradient id="moonShadowClean" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="rgba(20,24,32,0.45)" />
            <stop offset="50%" stopColor="rgba(15,18,24,0.78)" />
            <stop offset="100%" stopColor="rgba(10,12,16,0.92)" />
          </radialGradient>

          <clipPath id="moonClipClean">
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>

        <g clipPath="url(#moonClipClean)">
          {/* Base moon surface */}
          <circle cx={cx} cy={cy} r={r} fill="url(#moonSurfaceClean)" />

          {/* Simplified maria - subtle, elegant */}
          <g opacity="0.35">
            <ellipse cx={cx - 18} cy={cy - 22} rx="20" ry="16" fill="rgba(80,76,68,0.5)" />
            <ellipse cx={cx + 16} cy={cy - 14} rx="14" ry="15" fill="rgba(82,78,70,0.45)" />
            <ellipse cx={cx + 22} cy={cy + 8} rx="16" ry="14" fill="rgba(78,74,66,0.4)" />
            <ellipse cx={cx - 24} cy={cy + 4} rx="15" ry="22" fill="rgba(76,72,64,0.4)" />
            <ellipse cx={cx - 6} cy={cy + 28} rx="18" ry="12" fill="rgba(80,76,68,0.35)" />
          </g>

          {/* Key craters only - cleaner look */}
          <g opacity="0.5">
            <circle cx={cx - 4} cy={cy + 38} r="5" fill="rgba(95,90,82,0.4)" />
            <circle cx={cx - 4} cy={cy + 38} r="3.5" fill="rgba(210,205,195,0.25)" />
            <circle cx={cx - 22} cy={cy} r="4" fill="rgba(90,85,78,0.35)" />
            <circle cx={cx - 22} cy={cy} r="2.5" fill="rgba(200,195,185,0.2)" />
            <circle cx={cx - 6} cy={cy - 36} r="4" fill="rgba(70,66,60,0.45)" />
          </g>

          {/* Subtle inner shadow for depth */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="8"
            style={{ filter: "blur(4px)" }}
          />

          {/* Phase shadow */}
          <circle cx={cx + dx} cy={cy} r={r + 2} fill="url(#moonShadowClean)" />

          {/* Terminator edge softening */}
          <circle cx={cx + dx * 0.92} cy={cy} r={r + 1} fill="rgba(20,24,32,0.12)" />
        </g>

        {/* Crisp rim */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(200,195,185,0.18)"
          strokeWidth="0.75"
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

const MOON_INTRO = `The Moon — the collective world. The reaction.
Not what society does, but how it absorbs.
The emotional undercurrent beneath the structures. The reflexive response of the collective nervous system.
It's memory, mood, and meaning before narrative.
The Moon is the invisible climate: how communities metabolize change, regulate fear, create safety, and store experience.
It's the subconscious of civilization—the emotional body that responds to whatever the Sun puts into motion.`;

export default function MoonClient() {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<CalendarAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synthesis state
  const [synthesis, setSynthesis] = useState<Synthesis | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [synthesisCached, setSynthesisCached] = useState(false);

  async function loadSynthesis() {
    setSynthesisLoading(true);
    setSynthesisError(null);
    try {
      const res = await fetch("/api/moon/synthesis", { cache: "no-store" });
      const json = await res.json();

      if (res.status === 401) {
        setSynthesisError("sign_in");
        return;
      }

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to load synthesis");
      }

      setSynthesis(json.synthesis);
      setSynthesisCached(json.cached ?? false);
    } catch (e: any) {
      setSynthesisError(e?.message ?? "Failed to generate synthesis");
    } finally {
      setSynthesisLoading(false);
    }
  }

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
      {/* First Visit Intro Modal */}
      <FirstVisitIntroModal
        storageKey="ura:intro:moon:v1"
        title="Moon"
        body={MOON_INTRO}
      />

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
            title={`Phase ${lunarPhaseId} • ${currentMoonPhaseName}`}
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

        {/* Daily Synthesis Section */}
        <div className="mt-5 text-left">
          <div className="rounded-2xl border px-5 py-4" style={panelStyle}>
            <div
              className="text-xs tracking-widest text-center"
              style={{ color: M.ink, fontWeight: 800, letterSpacing: "0.16em" }}
            >
              DAILY SYNTHESIS
            </div>

            {!synthesis && !synthesisLoading && !synthesisError && (
              <div className="mt-4 text-center">
                <div className="text-sm mb-3" style={{ color: M.inkMuted }}>
                  Generate your personalized daily guidance using the URA system:
                  <br />
                  <span style={{ color: M.ink, fontWeight: 500 }}>Planet (force) → Modality (motion) → Phase (timing)</span>
                </div>
                <button
                  onClick={loadSynthesis}
                  className="rounded-full border px-5 py-2.5 text-sm font-medium transition-all"
                  style={{
                    color: M.ink,
                    borderColor: "rgba(18,22,32,0.18)",
                    background: "rgba(255,255,255,0.65)",
                  }}
                >
                  Generate Today's Synthesis
                </button>
                <div className="mt-2 text-xs" style={{ color: M.inkSoft }}>
                  One synthesis per day · Cached until midnight
                </div>
              </div>
            )}

            {synthesisLoading && (
              <div className="mt-4 text-center py-4">
                <div className="text-sm" style={{ color: M.inkMuted }}>
                  Generating synthesis…
                </div>
              </div>
            )}

            {synthesisError && !synthesis && (
              <div className="mt-4 text-center">
                {synthesisError === "sign_in" ? (
                  <>
                    <div className="text-sm mb-3" style={{ color: M.inkSoft }}>
                      Sign in to unlock your daily Moon synthesis.
                    </div>
                    <a
                      href="/login"
                      className="inline-block rounded-full border px-5 py-2 text-sm font-medium"
                      style={{
                        color: M.ink,
                        borderColor: "rgba(18,22,32,0.18)",
                        background: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Sign in
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-sm mb-2" style={{ color: "rgba(180,80,60,0.9)" }}>
                      {synthesisError}
                    </div>
                    <button
                      onClick={loadSynthesis}
                      className="rounded-full border px-4 py-2 text-sm"
                      style={{
                        color: M.ink,
                        borderColor: "rgba(18,22,32,0.14)",
                        background: "rgba(255,255,255,0.55)",
                      }}
                    >
                      Try Again
                    </button>
                  </>
                )}
              </div>
            )}

            {synthesis && (
              <div className="mt-4 space-y-4">
                <div className="text-center">
                  <div className="text-xl font-semibold" style={{ color: M.ink }}>
                    {synthesis.headline}
                  </div>
                  {synthesisCached && (
                    <div className="mt-1 text-xs" style={{ color: M.inkSoft }}>
                      Cached synthesis · Generated earlier today
                    </div>
                  )}
                </div>

                <div
                  className="rounded-xl border px-4 py-3"
                  style={{
                    borderColor: "rgba(18,22,32,0.10)",
                    background: "rgba(255,255,255,0.50)",
                  }}
                >
                  <div className="text-sm leading-relaxed" style={{ color: M.ink }}>
                    {synthesis.guidance}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    className="rounded-xl border px-4 py-3"
                    style={{
                      borderColor: "rgba(18,22,32,0.10)",
                      background: "rgba(255,255,255,0.45)",
                    }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: M.inkSoft }}>
                      Action
                    </div>
                    <div className="text-sm" style={{ color: M.ink }}>
                      {synthesis.actionHint}
                    </div>
                  </div>

                  <div
                    className="rounded-xl border px-4 py-3"
                    style={{
                      borderColor: "rgba(18,22,32,0.10)",
                      background: "rgba(255,255,255,0.45)",
                    }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: M.inkSoft }}>
                      Journal Prompt
                    </div>
                    <div className="text-sm italic" style={{ color: M.ink }}>
                      {synthesis.journalPrompt}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WNTR Phase Module - Current phase detailed info */}
        <div className="mt-4 text-left">
          <PhaseMicrocopyCard copy={lunarCopy} tone="linen" defaultExpanded={false} showJournal={true} showActionHint={true} />
        </div>

        {/* 8-Phase Reference Grid - moved below Phase Module */}
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
                    title={`${p.name} • URA Phase ${p.id}`}
                  >
                    <div style={{ color: M.ink }} className="text-2xl opacity-90">
                      {p.glyph}
                    </div>

                    <div className="mt-2 text-xs" style={{ color: M.inkMuted }}>
                      {p.name}
                    </div>

                    <div className="mt-2 text-sm font-semibold" style={{ color: M.ink }}>
                      Phase {p.id}
                    </div>

                    <div className="mt-2 text-xs" style={{ color: M.inkMuted }}>
                      {copy.oneLine}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-center" style={{ color: M.inkMuted }}>
              Current phase:{" "}
              <span style={{ color: M.ink, fontWeight: 700 }}>Phase {lunarPhaseId}</span> — {lunarCopy.oneLine}
            </div>
          </div>
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
