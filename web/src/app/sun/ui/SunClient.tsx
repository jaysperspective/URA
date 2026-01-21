// src/app/sun/ui/SunClient.tsx
"use client";

// ============================================
// COLLECTIVE ORIENTATION PAGE
// NO auth imports, NO profile caches, NO birth data
// Anchored to 0° Aries (tropical zodiac origin)
// ============================================

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import URAFoundationPanel from "@/components/ura/URAFoundationPanel";
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";
import { elementHeaderLabel, ELEMENT_REFERENCE } from "@/lib/calendar/element";

// ============================================
// TYPES
// ============================================
type SunAPIResponse = {
  ok: boolean;
  error?: string;
  tz: string;
  gregorian: {
    ymd: string;
    asOfLocal: string;
    asOfUTC: string;
  };
  solar: {
    sunSign: string;
    sunSignShort: string;
    sunSignGlyph: string;
    sunDegreeInSign: number;
    sunMinuteInSign: number;
    sunLongitude: number;
    solarSeasonLabel: string;
    solarPhaseLabel: string;
    solarPhase: number;
    dayInPhase: number;
    dayIndexInYear: number;
    yearLength: number;
  };
  lunar: {
    phaseName: string;
    lunarPhaseId: number;
    dayInPhase: number;
    lunarDay: number;
    lunarAgeDays: number;
    phaseAngleDeg: number;
    lunarDirective: string;
    moonSign: string;
  };
  ura: {
    foundationPrinciples: string[];
    microcopy: {
      solar: string;
      lunar: string;
    };
  };
};

type SynthesisOutput = {
  summary_sentence: string;
  dominant_layer: "solar" | "lunar" | "transitional";
  recommended_posture: "act" | "stabilize" | "observe" | "release";
  caution_note: string;
  signals: [string, string, string];
};

type SynthesisResponse = {
  ok: boolean;
  cached?: boolean;
  synthesis: SynthesisOutput;
  collective?: {
    sunSign: string;
    sunDegreeInSign: number;
    phaseName: string;
    solarPhaseLabel: string;
  };
  error?: string;
};

// ============================================
// COLOR CONSTANTS
// ============================================
const C = {
  linen: "#D5C0A5",
  ink: "#1F241A",
  inkMuted: "rgba(31,36,26,0.72)",
  inkSoft: "rgba(31,36,26,0.55)",
  surface: "rgba(244,235,221,0.88)",
  border: "rgba(31,36,26,0.16)",
  divider: "rgba(31,36,26,0.14)",
  gold: "#C8B26A",
};

// ============================================
// FETCH HELPERS
// ============================================
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

// ============================================
// COMPONENTS
// ============================================
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border px-5 py-4"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <div
        className="text-xs tracking-widest"
        style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
      >
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PostureBadge({ posture }: { posture: SynthesisOutput["recommended_posture"] }) {
  const colors: Record<string, { bg: string; text: string }> = {
    act: { bg: "rgba(200,178,106,0.25)", text: C.ink },
    stabilize: { bg: "rgba(127,168,161,0.25)", text: C.ink },
    observe: { bg: "rgba(143,158,147,0.25)", text: C.ink },
    release: { bg: "rgba(181,106,77,0.20)", text: C.ink },
  };
  const style = colors[posture] || colors.observe;

  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
      style={{ background: style.bg, color: style.text }}
    >
      {posture}
    </span>
  );
}

function DominantLayerBadge({ layer }: { layer: SynthesisOutput["dominant_layer"] }) {
  const labels: Record<string, string> = {
    solar: "Solar",
    lunar: "Lunar",
    transitional: "Transitional",
  };

  return (
    <span
      className="inline-block rounded-full border px-3 py-1 text-xs"
      style={{ borderColor: C.border, color: C.inkMuted }}
    >
      Dominant: {labels[layer] || layer}
    </span>
  );
}

// ============================================
// MAIN CLIENT COMPONENT
// ============================================
export default function SunClient() {
  const router = useRouter();

  const [data, setData] = useState<SunAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [synthesis, setSynthesis] = useState<SynthesisOutput | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [synthesisCached, setSynthesisCached] = useState(false);

  // ============================================
  // LOAD COLLECTIVE DATA
  // ============================================
  const loadCollectiveData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tzOffsetMin = -new Date().getTimezoneOffset();
      const url = `/api/sun?tzOffsetMin=${tzOffsetMin}&lat=0&lon=0`;

      const r = await fetchJsonLoose(url);
      if (!r.ok) {
        setError(r.error);
        setData(null);
        return;
      }

      setData(r.json as SunAPIResponse);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollectiveData();
  }, [loadCollectiveData]);

  // ============================================
  // GENERATE SYNTHESIS (manual trigger)
  // ============================================
  const generateSynthesis = useCallback(async () => {
    setSynthesisLoading(true);
    setSynthesisError(null);

    try {
      const tzOffsetMin = -new Date().getTimezoneOffset();
      const url = `/api/solar-synthesis?tzOffsetMin=${tzOffsetMin}&lat=0&lon=0`;

      const r = await fetchJsonLoose(url);
      if (!r.ok) {
        setSynthesisError(r.error);
        return;
      }

      const resp = r.json as SynthesisResponse;
      if (resp.synthesis) {
        setSynthesis(resp.synthesis);
        setSynthesisCached(resp.cached === true);
      } else {
        setSynthesisError("Invalid synthesis response");
      }
    } catch (e: any) {
      setSynthesisError(e?.message || "Synthesis failed");
    } finally {
      setSynthesisLoading(false);
    }
  }, []);

  // ============================================
  // HANDOFF TO /PROFILE
  // ============================================
  const handlePersonalize = useCallback(() => {
    const ts = data?.gregorian?.asOfUTC || new Date().toISOString();
    const dominant = synthesis?.dominant_layer || "";

    const params = new URLSearchParams({
      from: "sun",
      ts,
      focus: "orientation",
    });
    if (dominant) params.set("dominant", dominant);

    const targetUrl = `/profile?${params.toString()}`;

    // We don't check auth here - profile page will redirect to login if needed
    // The login flow will preserve the returnTo param
    router.push(targetUrl);
  }, [router, data, synthesis]);

  // ============================================
  // DERIVED VALUES
  // ============================================
  const solarPhaseId = data?.solar?.solarPhase as PhaseId | undefined;
  const solarPhaseCopy = useMemo(() => {
    if (typeof solarPhaseId === "number" && solarPhaseId >= 1 && solarPhaseId <= 8) {
      return microcopyForPhase(solarPhaseId as PhaseId);
    }
    return microcopyForPhase(1);
  }, [solarPhaseId]);

  const lunarPhaseId = data?.lunar?.lunarPhaseId as PhaseId | undefined;
  const lunarPhaseCopy = useMemo(() => {
    if (typeof lunarPhaseId === "number" && lunarPhaseId >= 1 && lunarPhaseId <= 8) {
      return microcopyForPhase(lunarPhaseId as PhaseId);
    }
    return microcopyForPhase(1);
  }, [lunarPhaseId]);

  const solarProgress01 = useMemo(() => {
    if (typeof data?.solar?.dayInPhase === "number") {
      return (data.solar.dayInPhase - 1) / 45;
    }
    return null;
  }, [data?.solar?.dayInPhase]);

  const sunText = useMemo(() => {
    if (!data?.solar) return "—";
    const { sunSignShort, sunDegreeInSign, sunMinuteInSign } = data.solar;
    return `${sunDegreeInSign}° ${sunSignShort} ${String(sunMinuteInSign).padStart(2, "0")}'`;
  }, [data?.solar]);

  // Compute current element label from sun sign
  const currentElementLabel = useMemo(() => {
    if (!data?.solar?.sunSign) return "Air • Communication"; // Default during Aquarius season
    return elementHeaderLabel(data.solar.sunSign);
  }, [data?.solar?.sunSign]);

  // ============================================
  // CARD STYLE
  // ============================================
  const cardStyle = {
    background:
      "linear-gradient(180deg, rgba(244,235,221,0.92) 0%, rgba(213,192,165,0.82) 55%, rgba(185,176,123,0.55) 120%)",
    borderColor: C.border,
    boxShadow: "0 26px 90px rgba(31,36,26,0.18), 0 2px 0 rgba(255,255,255,0.35) inset",
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-5">
      {/* MAIN CARD */}
      <div className="rounded-3xl border px-6 py-7" style={cardStyle}>
        {/* Context Label */}
        <div className="text-center">
          <div className="text-sm tracking-widest" style={{ color: C.inkSoft }}>
            COLLECTIVE ORIENTATION
          </div>
          <div className="mt-1 text-sm font-medium" style={{ color: C.ink }}>
            {currentElementLabel}
          </div>
          {/* Element reference (static) */}
          <div className="mt-2 text-xs" style={{ color: C.inkMuted }}>
            {Object.values(ELEMENT_REFERENCE).join(" · ")}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            className="mt-4 mx-auto max-w-[560px] rounded-2xl border px-4 py-3 text-left text-sm"
            style={{
              borderColor: C.border,
              background: "rgba(244,235,221,0.70)",
              color: C.ink,
            }}
          >
            <div className="font-semibold">Data unavailable</div>
            <div style={{ color: C.inkMuted }}>{error}</div>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="mt-6 text-center text-sm" style={{ color: C.inkMuted }}>
            Loading collective data...
          </div>
        )}

        {/* Content */}
        {data && !loading && (
          <>
            {/* Current Sun Position */}
            <div className="mt-6 text-center">
              <div className="text-4xl font-semibold tracking-tight" style={{ color: C.ink }}>
                {data.solar.sunSign}
              </div>
              <div className="mt-2 text-lg" style={{ color: C.inkMuted }}>
                {data.solar.sunDegreeInSign}° {data.solar.sunMinuteInSign}'
              </div>
              <div className="mt-1 text-sm" style={{ color: C.inkSoft }}>
                {data.solar.solarSeasonLabel} · {data.solar.solarPhaseLabel}
              </div>
            </div>

            {/* Phase Badges */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <div
                className="rounded-full border px-3 py-1 text-xs"
                style={{
                  background: "rgba(244,235,221,0.70)",
                  borderColor: C.border,
                  color: C.ink,
                }}
                title={`${solarPhaseCopy.season} · Phase ${data.solar.solarPhase}`}
              >
                Solar URA: <span className="font-semibold">Phase {data.solar.solarPhase}</span>
              </div>

              <div
                className="rounded-full border px-3 py-1 text-xs"
                style={{
                  background: "rgba(244,235,221,0.70)",
                  borderColor: C.border,
                  color: C.ink,
                }}
                title={`${lunarPhaseCopy.season} · Phase ${data.lunar.lunarPhaseId}`}
              >
                Lunar URA: <span className="font-semibold">Phase {data.lunar.lunarPhaseId}</span>
              </div>
            </div>

            {/* GRID: Solar + Lunar Context */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Solar Context */}
              <SectionCard title="SOLAR CONTEXT">
                <div className="text-sm" style={{ color: C.ink }}>
                  Phase <span className="font-semibold">{data.solar.solarPhase}</span> of 8 · Day{" "}
                  <span className="font-semibold">{data.solar.dayInPhase}</span> of 45
                </div>

                <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
                  Year Day: {data.solar.dayIndexInYear} / {data.solar.yearLength}
                </div>

                {/* Progress Bar */}
                <div
                  className="mt-3 w-full h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(31,36,26,0.18)" }}
                >
                  <div
                    className="h-full"
                    style={{
                      background: "rgba(31,36,26,0.55)",
                      width: `${Math.round(
                        ((data.solar.dayIndexInYear + 1) / data.solar.yearLength) * 100
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
                  Season: <span className="font-semibold">{data.solar.solarSeasonLabel}</span>
                </div>

                <div className="mt-2 text-xs" style={{ color: C.inkSoft }}>
                  {solarPhaseCopy.oneLine}
                </div>
              </SectionCard>

              {/* Lunar Context (NO visualization) */}
              <SectionCard title="LUNAR CONTEXT">
                <div className="text-sm" style={{ color: C.ink }}>
                  <span className="font-semibold">{data.lunar.phaseName}</span> · Day{" "}
                  {data.lunar.lunarDay}
                </div>

                <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
                  Phase {data.lunar.lunarPhaseId} of 8 · Day {data.lunar.dayInPhase} in phase
                </div>

                <div className="mt-2 text-sm" style={{ color: C.inkMuted }}>
                  Moon in <span className="font-semibold">{data.lunar.moonSign}</span>
                </div>

                <div className="mt-3 text-xs" style={{ color: C.inkSoft }}>
                  <span className="font-semibold">Directive:</span> {data.lunar.lunarDirective}
                </div>
              </SectionCard>
            </div>

            {/* SOLAR SYNTHESIS CARD */}
            <div
              className="mt-4 rounded-2xl border px-5 py-4"
              style={{ background: C.surface, borderColor: C.border }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div
                    className="text-xs tracking-widest"
                    style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
                  >
                    SOLAR SYNTHESIS
                  </div>
                  <div className="mt-1 text-xs" style={{ color: C.inkSoft }}>
                    LLM-generated collective orientation
                  </div>
                </div>

                <button
                  type="button"
                  onClick={generateSynthesis}
                  disabled={synthesisLoading}
                  className="rounded-2xl px-4 py-2 text-sm border transition"
                  style={{
                    background: "rgba(244,235,221,0.70)",
                    borderColor: C.border,
                    color: C.ink,
                    opacity: synthesisLoading ? 0.6 : 1,
                    cursor: synthesisLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {synthesisLoading ? "Generating..." : synthesis ? "Refresh Synthesis" : "Generate Synthesis"}
                </button>
              </div>

              {synthesisError && (
                <div className="mt-3 text-sm" style={{ color: "#B56A4D" }}>
                  {synthesisError}
                </div>
              )}

              {synthesis && (
                <div className="mt-4 space-y-4">
                  {/* Summary */}
                  <div>
                    <div className="text-base font-semibold" style={{ color: C.ink }}>
                      {synthesis.summary_sentence}
                    </div>
                    {synthesisCached && (
                      <div className="mt-1 text-xs" style={{ color: C.inkSoft }}>
                        (cached)
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <PostureBadge posture={synthesis.recommended_posture} />
                    <DominantLayerBadge layer={synthesis.dominant_layer} />
                  </div>

                  {/* Caution */}
                  <div className="text-sm" style={{ color: C.inkMuted }}>
                    <span className="font-semibold">Caution:</span> {synthesis.caution_note}
                  </div>

                  {/* Signals */}
                  <div>
                    <div
                      className="text-xs tracking-widest mb-2"
                      style={{ color: C.inkSoft, fontWeight: 700 }}
                    >
                      SIGNALS
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {synthesis.signals.map((signal, i) => (
                        <span
                          key={i}
                          className="rounded-full border px-3 py-1 text-xs"
                          style={{
                            background: "rgba(244,235,221,0.50)",
                            borderColor: C.border,
                            color: C.ink,
                          }}
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!synthesis && !synthesisLoading && (
                <div className="mt-3 text-sm" style={{ color: C.inkMuted }}>
                  Click "Generate Synthesis" for a collective orientation reading.
                </div>
              )}
            </div>

            {/* URA FOUNDATION PANEL */}
            <div className="mt-4">
              <URAFoundationPanel
                solarPhaseId={data.solar.solarPhase}
                solarProgress01={solarProgress01}
                sunText={sunText}
                ontology={null}
                asOfLabel={data.gregorian.asOfLocal}
              />
            </div>

            {/* HANDOFF CTA */}
            <div
              className="mt-4 rounded-2xl border px-5 py-4 text-center"
              style={{ background: "rgba(200,178,106,0.12)", borderColor: C.border }}
            >
              <div className="text-sm font-semibold" style={{ color: C.ink }}>
                Want to see your personal timing?
              </div>
              <div className="mt-1 text-xs" style={{ color: C.inkMuted }}>
                Switch from collective time (0° Aries) to your personal clock (Ascendant-based).
              </div>

              <button
                type="button"
                onClick={handlePersonalize}
                className="mt-3 rounded-2xl px-5 py-2 text-sm font-medium transition"
                style={{
                  background: C.gold,
                  color: C.ink,
                }}
              >
                Personalize this moment
              </button>
            </div>

            {/* Timestamp */}
            <div className="mt-4 text-center text-xs" style={{ color: C.inkSoft }}>
              As of {data.gregorian.asOfLocal} (local)
            </div>
          </>
        )}
      </div>
    </div>
  );
}
