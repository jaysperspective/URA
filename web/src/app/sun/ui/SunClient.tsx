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
import { elementHeaderLabel } from "@/lib/calendar/element";

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
  collective_context?: string;
};

type NewsCategory = {
  key: string;
  count: number;
  sampleTitles: string[];
};

type CollectiveSignalsData = {
  newsThemes?: NewsCategory[];
  tempo?: {
    level: "low" | "medium" | "high";
    rationale: string;
  };
  markets?: {
    riskTone: "risk_on" | "risk_off" | "mixed";
    volatility: "contracting" | "expanding" | "flat" | "unknown";
    breadth: "broad" | "narrow" | "mixed" | "unknown";
    snapshot: {
      sp500ChangePct?: number;
      nasdaqChangePct?: number;
      vixLevel?: number;
    };
    rationale: string;
  };
  asOfISO: string;
  notes?: string[];
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
  collectiveSignals?: CollectiveSignalsData;
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
// COLLECTIVE SIGNALS COMPONENT
// ============================================
function CollectiveSignalsCard({ signals }: { signals: CollectiveSignalsData }) {
  const [expanded, setExpanded] = useState(false);

  const hasData = (signals.newsThemes?.length ?? 0) > 0 || signals.markets;

  if (!hasData) return null;

  // Format market tone
  const formatRiskTone = (tone: string) => {
    switch (tone) {
      case "risk_on":
        return "Risk On";
      case "risk_off":
        return "Risk Off";
      default:
        return "Mixed";
    }
  };

  // Format volatility
  const formatVolatility = (vol: string) => {
    switch (vol) {
      case "expanding":
        return "Expanding";
      case "contracting":
        return "Contracting";
      case "flat":
        return "Flat";
      default:
        return "—";
    }
  };

  // Get top categories (max 4)
  const topCategories = signals.newsThemes?.slice(0, 4) ?? [];

  // Format category key for display
  const formatCategory = (key: string) => {
    return key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const tempoColor =
    signals.tempo?.level === "high"
      ? "rgba(181,106,77,0.85)"
      : signals.tempo?.level === "medium"
      ? C.ink
      : C.inkMuted;

  return (
    <div
      className="rounded-2xl border px-5 py-4"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <div
            className="text-xs tracking-widest"
            style={{ color: C.ink, fontWeight: 800, letterSpacing: "0.16em" }}
          >
            COLLECTIVE SIGNALS
          </div>
          <div className="mt-1 text-xs" style={{ color: C.inkSoft }}>
            News themes + market state
          </div>
        </div>
        <span
          className="text-sm transition-transform"
          style={{ color: C.inkMuted, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Tempo */}
          {signals.tempo && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: C.inkMuted }}>
                Tempo:
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase"
                style={{
                  background:
                    signals.tempo.level === "high"
                      ? "rgba(181,106,77,0.15)"
                      : signals.tempo.level === "medium"
                      ? "rgba(200,178,106,0.20)"
                      : "rgba(143,158,147,0.15)",
                  color: tempoColor,
                }}
              >
                {signals.tempo.level}
              </span>
              <span className="text-xs" style={{ color: C.inkSoft }}>
                {signals.tempo.rationale}
              </span>
            </div>
          )}

          {/* News Themes */}
          {topCategories.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: C.inkMuted }}>
                Dominant Themes
              </div>
              <div className="flex flex-wrap gap-2">
                {topCategories.map((cat) => (
                  <div
                    key={cat.key}
                    className="rounded-xl border px-3 py-2"
                    style={{
                      background: "rgba(244,235,221,0.60)",
                      borderColor: C.border,
                    }}
                  >
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold" style={{ color: C.ink }}>
                        {formatCategory(cat.key)}
                      </span>
                      <span className="text-xs" style={{ color: C.inkMuted }}>
                        ({cat.count})
                      </span>
                    </div>
                    {cat.sampleTitles.length > 0 && (
                      <div
                        className="mt-1 text-xs line-clamp-1"
                        style={{ color: C.inkSoft, maxWidth: 200 }}
                        title={cat.sampleTitles[0]}
                      >
                        {cat.sampleTitles[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market State */}
          {signals.markets && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: C.inkMuted }}>
                Market Tone
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      signals.markets.riskTone === "risk_on"
                        ? "bg-green-500"
                        : signals.markets.riskTone === "risk_off"
                        ? "bg-red-400"
                        : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-sm" style={{ color: C.ink }}>
                    {formatRiskTone(signals.markets.riskTone)}
                  </span>
                </div>

                {signals.markets.volatility !== "unknown" && (
                  <div className="text-sm" style={{ color: C.inkMuted }}>
                    Volatility: {formatVolatility(signals.markets.volatility)}
                  </div>
                )}

                {signals.markets.snapshot.vixLevel !== undefined && (
                  <div className="text-sm" style={{ color: C.inkMuted }}>
                    VIX: {signals.markets.snapshot.vixLevel.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Market Snapshot */}
              {(signals.markets.snapshot.sp500ChangePct !== undefined ||
                signals.markets.snapshot.nasdaqChangePct !== undefined) && (
                <div className="mt-2 flex gap-4 text-xs" style={{ color: C.inkSoft }}>
                  {signals.markets.snapshot.sp500ChangePct !== undefined && (
                    <span>
                      S&P 500:{" "}
                      <span
                        style={{
                          color:
                            signals.markets.snapshot.sp500ChangePct >= 0
                              ? "rgba(80,140,80,0.9)"
                              : "rgba(180,80,60,0.9)",
                        }}
                      >
                        {signals.markets.snapshot.sp500ChangePct >= 0 ? "+" : ""}
                        {signals.markets.snapshot.sp500ChangePct.toFixed(2)}%
                      </span>
                    </span>
                  )}
                  {signals.markets.snapshot.nasdaqChangePct !== undefined && (
                    <span>
                      Nasdaq:{" "}
                      <span
                        style={{
                          color:
                            signals.markets.snapshot.nasdaqChangePct >= 0
                              ? "rgba(80,140,80,0.9)"
                              : "rgba(180,80,60,0.9)",
                        }}
                      >
                        {signals.markets.snapshot.nasdaqChangePct >= 0 ? "+" : ""}
                        {signals.markets.snapshot.nasdaqChangePct.toFixed(2)}%
                      </span>
                    </span>
                  )}
                </div>
              )}

              {signals.markets.rationale && (
                <div className="mt-2 text-xs" style={{ color: C.inkSoft }}>
                  {signals.markets.rationale}
                </div>
              )}
            </div>
          )}

          {/* Notes/Warnings */}
          {signals.notes && signals.notes.length > 0 && (
            <div className="text-xs" style={{ color: C.inkSoft }}>
              {signals.notes.join(" · ")}
            </div>
          )}

          {/* As Of */}
          <div className="text-xs" style={{ color: C.inkSoft }}>
            As of {new Date(signals.asOfISO).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      )}
    </div>
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
  const [collectiveSignals, setCollectiveSignals] = useState<CollectiveSignalsData | null>(null);

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
        if (resp.collectiveSignals) {
          setCollectiveSignals(resp.collectiveSignals);
        }
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

                  {/* Collective Context (NEW) */}
                  {synthesis.collective_context && (
                    <div
                      className="rounded-xl border px-4 py-3"
                      style={{
                        background: "rgba(200,178,106,0.08)",
                        borderColor: "rgba(200,178,106,0.25)",
                      }}
                    >
                      <div className="text-sm" style={{ color: C.ink }}>
                        {synthesis.collective_context}
                      </div>
                    </div>
                  )}

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

            {/* COLLECTIVE SIGNALS CARD (expandable) */}
            {collectiveSignals && (
              <div className="mt-4">
                <CollectiveSignalsCard signals={collectiveSignals} />
              </div>
            )}

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
