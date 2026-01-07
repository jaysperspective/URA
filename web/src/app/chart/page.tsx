// src/app/chart/page.tsx
"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Mode = "market" | "personal";

type GannResponse =
  | { ok: true; mode: Mode; input: any; data: any }
  | { ok: false; error: string; retryAfterSeconds?: number };

const DEFAULT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/* -------------------- Pivot Precheck Types -------------------- */

type PivotScoreState = {
  legBirth: 0 | 1 | 2 | 3; // 0–3
  structure: 0 | 1 | 2; // 0–2
  followThrough: 0 | 1 | 2; // 0–2
  timeFit: 0 | 1 | 2; // 0–2
  sanity: 0 | 1; // 0–1
};

type PivotPrecheckResult = {
  total: number; // 0–10
  autoFail: boolean;
  hardPass: boolean; // strict rule
  recommendedAction: "USE" | "MARGINAL" | "REJECT";
  reasons: string[];
  state: PivotScoreState;
};

export default function ChartPage() {
  const [mode, setMode] = useState<Mode>("market");

  // MARKET inputs
  const [symbol, setSymbol] = useState("SOL-USD");
  const [anchorPrice, setAnchorPrice] = useState("200");
  const [tickSize, setTickSize] = useState("0.01");
  const [anglesCsv, setAnglesCsv] = useState(DEFAULT_ANGLES.join(","));
  const [includeDownside, setIncludeDownside] = useState(true);

  // Market marker upgrade: pivot datetime + cycle length
  const [pivotDateTime, setPivotDateTime] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  });
  const [marketCycleDays, setMarketCycleDays] = useState("90");

  // PERSONAL inputs
  const [anchorDateTime, setAnchorDateTime] = useState("1990-01-24T01:39");
  const [cycleDays, setCycleDays] = useState("365.2425");
  const [personalAnglesCsv, setPersonalAnglesCsv] = useState(DEFAULT_ANGLES.join(","));

  // Pivot pre-check (market mode only)
  const [precheck, setPrecheck] = useState<PivotPrecheckResult | null>(null);

  const [res, setRes] = useState<GannResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const angles = useMemo(
    () => parseAnglesCsv(mode === "market" ? anglesCsv : personalAnglesCsv),
    [mode, anglesCsv, personalAnglesCsv]
  );

  // Strict: only allow Run when pivot is USE (hardPass)
  const runDisabled =
    loading ||
    (mode === "market" && precheck != null && precheck.recommendedAction !== "USE");

  async function run() {
    if (runDisabled) return;

    setLoading(true);
    setRes(null);

    try {
      const payload =
        mode === "market"
          ? {
              mode,
              symbol: symbol.trim() || undefined,
              anchor: Number(anchorPrice),
              tickSize: Number(tickSize),
              angles,
              includeDownside,
              pivotDateTime,
              cycleDays: Number(marketCycleDays),
            }
          : {
              mode,
              anchorDateTime,
              cycleDays: Number(cycleDays),
              angles,
            };

      const r = await fetch("/api/gann", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await r.json()) as GannResponse;
      setRes(json);
    } catch (e: any) {
      setRes({ ok: false, error: e?.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  const cardTitle = mode === "market" ? "Gann — Market" : "Gann — Personal";

  const topBarVerdict =
    mode === "market" && precheck
      ? `${precheck.recommendedAction} (${precheck.total}/10)`
      : null;

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        {/* Top bar */}
        <div style={topBarStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ opacity: 0.85 }}>Chart mode</span>

            <Segmented
              value={mode}
              options={[
                { value: "market", label: "Market" },
                { value: "personal", label: "Personal" },
              ]}
              onChange={(v) => setMode(v as Mode)}
            />

            {topBarVerdict ? (
              <span style={{ fontSize: 12, opacity: 0.85 }}>
                Pivot: <strong>{topBarVerdict}</strong>
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={run}
            disabled={runDisabled}
            style={{
              ...buttonStyle,
              paddingInline: 14,
              opacity: runDisabled ? 0.45 : 1,
              cursor: runDisabled ? "not-allowed" : "pointer",
            }}
            title={
              mode === "market" && precheck && precheck.recommendedAction !== "USE"
                ? "Pivot pre-check must be USE (hard pass) to run Market mode."
                : undefined
            }
          >
            {loading ? "Running…" : "Run"}
          </button>
        </div>

        <div style={gridStyle}>
          {/* Inputs */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>{cardTitle} Inputs</div>

            <div style={{ padding: 12 }}>
              {mode === "market" ? (
                <>
                  {/* Pivot pre-check panel */}
                  <PivotPrecheckPanel
                    onChange={setPrecheck}
                    initial={{
                      legBirth: 2,
                      structure: 2,
                      followThrough: 1,
                      timeFit: 1,
                      sanity: 1,
                    }}
                  />

                  <Field label="Symbol (optional)">
                    <input value={symbol} onChange={(e) => setSymbol(e.target.value)} style={inputStyle} />
                  </Field>

                  <Field label="Anchor price (required)">
                    <input
                      value={anchorPrice}
                      onChange={(e) => setAnchorPrice(e.target.value)}
                      inputMode="decimal"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Tick size (rounding)">
                    <input
                      value={tickSize}
                      onChange={(e) => setTickSize(e.target.value)}
                      inputMode="decimal"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Angles (degrees, CSV)">
                    <input value={anglesCsv} onChange={(e) => setAnglesCsv(e.target.value)} style={inputStyle} />
                  </Field>

                  <label style={checkRowStyle}>
                    <input
                      type="checkbox"
                      checked={includeDownside}
                      onChange={(e) => setIncludeDownside(e.target.checked)}
                    />
                    <span style={{ opacity: 0.9 }}>Include downside targets</span>
                  </label>

                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(58,69,80,0.6)" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
                      Market Marker (time → angle)
                    </div>

                    <Field label="Pivot date/time (local)">
                      <input
                        type="datetime-local"
                        value={pivotDateTime}
                        onChange={(e) => setPivotDateTime(e.target.value)}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Market cycle length (days)">
                      <input
                        value={marketCycleDays}
                        onChange={(e) => setMarketCycleDays(e.target.value)}
                        inputMode="decimal"
                        style={inputStyle}
                      />
                    </Field>

                    <div style={helpStyle}>
                      Marker maps <em>time since pivot</em> into the 360° ring:
                      <br />
                      <code style={codeStyle}>deg = ((now - pivot)/cycleDays mod 1) × 360</code>
                    </div>
                  </div>

                  <div style={helpStyle}>
                    Price targets use classic Square-of-9 sqrt step:
                    <br />
                    <code style={codeStyle}>target = (sqrt(anchor) ± (angle/180))²</code>
                  </div>

                  {precheck && precheck.recommendedAction !== "USE" ? (
                    <div style={{ ...warnStyle, marginTop: 12 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Pivot pre-check not passing</div>
                      <div style={{ opacity: 0.9, fontSize: 12, lineHeight: 1.4 }}>
                        Market mode is locked until the pre-check is <strong>USE</strong> (hard pass).
                        {precheck.reasons.length ? (
                          <>
                            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 12 }}>Why:</div>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {precheck.reasons.slice(0, 4).map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <Field label="Anchor date/time (local)">
                    <input
                      type="datetime-local"
                      value={anchorDateTime}
                      onChange={(e) => setAnchorDateTime(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Cycle length (days)">
                    <input
                      value={cycleDays}
                      onChange={(e) => setCycleDays(e.target.value)}
                      inputMode="decimal"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Angles (degrees, CSV)">
                    <input
                      value={personalAnglesCsv}
                      onChange={(e) => setPersonalAnglesCsv(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>

                  <div style={helpStyle}>
                    Personal mode maps time → angle:
                    <br />
                    <code style={codeStyle}>deg = ((now - anchor)/cycleDays mod 1) × 360</code>
                  </div>
                </>
              )}

              {res && !res.ok && (
                <div style={{ ...errorStyle, marginTop: 12 }}>
                  Error: {res.error}
                  {res.retryAfterSeconds ? ` (retry after ${res.retryAfterSeconds}s)` : null}
                </div>
              )}
            </div>
          </div>

          {/* Visualization */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>Angle Ring</div>

            {res?.ok ? (
              <AngleRing
                angles={angles}
                markerDeg={res.data?.markerDeg ?? null}
                subtitle={
                  mode === "market"
                    ? `Anchor: ${formatNum(res.data.anchor)}${res.input.symbol ? ` (${res.input.symbol})` : ""}`
                    : `Now @ ${formatNum(res.data.markerDeg)}° of cycle`
                }
              />
            ) : (
              <div style={{ opacity: 0.8, padding: 12 }}>Run to generate the ring and outputs.</div>
            )}
          </div>

          {/* Outputs */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>Outputs</div>

            {res?.ok ? (
              mode === "market" ? (
                <TargetsPanel data={res.data} />
              ) : (
                <PersonalPanel data={res.data} />
              )
            ) : (
              <div style={{ opacity: 0.8, padding: 12 }}>Outputs appear here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- UI Components -------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
      {children}
    </label>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={segWrapStyle}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{ ...segBtnStyle, ...(active ? segBtnActiveStyle : null) }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PivotPrecheckPanel({
  initial,
  onChange,
}: {
  initial?: Partial<PivotScoreState>;
  onChange?: (result: PivotPrecheckResult) => void;
}) {
  const DEFAULTS: PivotScoreState = {
    legBirth: 2,
    structure: 2,
    followThrough: 1,
    timeFit: 1,
    sanity: 1,
  };

  const [s, setS] = useState<PivotScoreState>({ ...DEFAULTS, ...(initial ?? {}) } as PivotScoreState);

  const result = useMemo<PivotPrecheckResult>(() => {
    const total = s.legBirth + s.structure + s.followThrough + s.timeFit + s.sanity;

    const autoFail = s.legBirth === 0 || s.structure === 0 || s.timeFit === 0;

    const reasons: string[] = [];
    if (s.legBirth === 0) reasons.push("Leg Birth = 0 (bounce/spike/continuation).");
    if (s.structure === 0) reasons.push("Structure = 0 (pivot violated / no confirmation).");
    if (s.timeFit === 0) reasons.push("Time Fit = 0 (cycle doesn’t express cleanly).");

    const hardPass = !autoFail && s.legBirth >= 2 && s.structure === 2 && total >= 7;

    let recommendedAction: PivotPrecheckResult["recommendedAction"] = "REJECT";

    if (hardPass) {
      recommendedAction = "USE";
    } else if (!autoFail && total >= 5) {
      recommendedAction = "MARGINAL";
      if (total < 7) reasons.push("Total < 7 (not strong enough to anchor a 45/90-day cycle).");
      if (s.legBirth < 2) reasons.push("Leg Birth < 2 (not a clear new leg).");
      if (s.structure < 2) reasons.push("Structure < 2 (not fully confirmed).");
    } else {
      if (!autoFail) reasons.push("Total < 5 (insufficient evidence).");
    }

    return { total, autoFail, hardPass, recommendedAction, reasons, state: s };
  }, [s]);

  useEffect(() => {
    onChange?.(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.total, result.autoFail, result.hardPass, result.recommendedAction, s]);

  const badge =
    result.recommendedAction === "USE"
      ? { text: "USE PIVOT", tone: "good" as const }
      : result.recommendedAction === "MARGINAL"
      ? { text: "MARGINAL", tone: "warn" as const }
      : { text: "REJECT", tone: "bad" as const };

  return (
    <div style={precheckPanelStyle}>
      <div style={precheckHeaderRow}>
        <div>
          <div style={precheckTitle}>Pivot Pre-Check</div>
          <div style={precheckSubtitle}>
            Score the candidate pivot before you anchor the cycle (1D · 45/90-day).
          </div>
        </div>

        <div style={precheckScoreBox}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Total</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{result.total}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>/10</div>
          </div>
          <div style={{ ...precheckBadgeStyle, ...precheckBadgeTone(badge.tone) }}>{badge.text}</div>
        </div>
      </div>

      <div style={precheckGrid}>
        <ScoreRow
          label="1) Leg Birth"
          hint="Did a new directional leg begin here?"
          value={s.legBirth}
          options={[0, 1, 2, 3]}
          onChange={(v) => setS((p) => ({ ...p, legBirth: v as PivotScoreState["legBirth"] }))}
        />

        <ScoreRow
          label="2) Structure"
          hint="Higher-low / lower-high confirmation within ~5–10 days?"
          value={s.structure}
          options={[0, 1, 2]}
          onChange={(v) => setS((p) => ({ ...p, structure: v as PivotScoreState["structure"] }))}
        />

        <ScoreRow
          label="3) Follow-Through"
          hint="Did price travel meaningfully away (energy / commitment)?"
          value={s.followThrough}
          options={[0, 1, 2]}
          onChange={(v) => setS((p) => ({ ...p, followThrough: v as PivotScoreState["followThrough"] }))}
        />

        <ScoreRow
          label="4) Time Symmetry Fit"
          hint="Does early base → mid expansion → late exhaustion express cleanly?"
          value={s.timeFit}
          options={[0, 1, 2]}
          onChange={(v) => setS((p) => ({ ...p, timeFit: v as PivotScoreState["timeFit"] }))}
        />

        <ScoreRow
          label="5) Sanity"
          hint="Does this pivot tell the truth without excuses?"
          value={s.sanity}
          options={[0, 1]}
          onChange={(v) => setS((p) => ({ ...p, sanity: v as PivotScoreState["sanity"] }))}
        />
      </div>

      <div style={precheckRules}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Strict pass rule</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.5, opacity: 0.85 }}>
          <li>Auto-fail if <b>Leg Birth = 0</b> or <b>Structure = 0</b> or <b>Time Fit = 0</b></li>
          <li>Hard pass requires <b>Leg Birth ≥ 2</b>, <b>Structure = 2</b>, and <b>Total ≥ 7</b></li>
        </ul>
      </div>

      <div style={precheckFooterRow}>
        <button type="button" onClick={() => setS(DEFAULTS)} style={btnGhost}>
          Reset
        </button>

        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(result, null, 2))}
          style={btnGhost}
        >
          Copy verdict
        </button>
      </div>
    </div>
  );
}

function ScoreRow(props: {
  label: string;
  hint: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div style={precheckRow}>
      <div>
        <div style={precheckRowLabel}>{props.label}</div>
        <div style={precheckRowHint}>{props.hint}</div>
      </div>

      <div style={precheckSegWrap}>
        {props.options.map((opt) => {
          const active = opt === props.value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => props.onChange(opt)}
              style={{
                ...precheckSegBtn,
                ...(active ? precheckSegBtnActive : null),
              }}
              aria-pressed={active}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AngleRing({
  angles,
  markerDeg,
  subtitle,
}: {
  angles: number[];
  markerDeg: number | null;
  subtitle?: string;
}) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 120;

  // Quadrant shading (subtle, 4 wedges: 0–90, 90–180, 180–270, 270–360)
  // Oriented with 0° at WEST, increasing clockwise.
  const quadrantWedges = [
    { start: 0, end: 90, opacity: 0.10 },
    { start: 90, end: 180, opacity: 0.06 },
    { start: 180, end: 270, opacity: 0.10 },
    { start: 270, end: 360, opacity: 0.06 },
  ];

  const spokes = angles.map((deg) => {
    const p = polarToXY_West0_CW(cx, cy, r, deg);
    return { deg, x2: p.x, y2: p.y };
  });

  const marker = markerDeg == null ? null : polarToXY_West0_CW(cx, cy, r, markerDeg);

  return (
    <div style={{ padding: 12 }}>
      {subtitle ? <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>{subtitle}</div> : null}

      <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
        {/* Quadrant wedges */}
        {quadrantWedges.map((q) => (
          <path
            key={`${q.start}-${q.end}`}
            d={wedgePath(cx, cy, r, q.start, q.end)}
            fill={`rgba(237,227,204,${q.opacity})`}
            stroke="none"
          />
        ))}

        {/* Outer circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(237,227,204,0.25)" strokeWidth={2} />

        {/* spokes + labels */}
        {spokes.map((s) => (
          <g key={s.deg}>
            <line x1={cx} y1={cy} x2={s.x2} y2={s.y2} stroke="rgba(237,227,204,0.15)" strokeWidth={2} />
            <text
              x={cx + (s.x2 - cx) * 1.12}
              y={cy + (s.y2 - cy) * 1.12}
              fill="rgba(237,227,204,0.8)"
              fontSize={11}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {s.deg}°
            </text>
          </g>
        ))}

        {/* marker */}
        {marker ? (
          <>
            <circle cx={marker.x} cy={marker.y} r={6} fill="rgba(237,227,204,0.95)" />
            <circle cx={marker.x} cy={marker.y} r={10} fill="none" stroke="rgba(237,227,204,0.35)" />
          </>
        ) : null}

        {/* center */}
        <circle cx={cx} cy={cy} r={3} fill="rgba(237,227,204,0.55)" />
      </svg>

      <div style={{ fontSize: 12, opacity: 0.85, textAlign: "center", marginTop: 10 }}>
        {markerDeg == null ? "Marker appears after run." : `Marker: ${formatNum(markerDeg)}°`}
      </div>

      <div style={{ fontSize: 11, opacity: 0.65, textAlign: "center", marginTop: 6 }}>
        0° West • 90° North • 180° East • 270° South
      </div>
    </div>
  );
}

function TargetsPanel({ data }: { data: any }) {
  const markerOk = typeof data.markerDeg === "number" && Number.isFinite(data.markerDeg);

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        Anchor: <strong>{formatNum(data.anchor)}</strong>
      </div>

      {markerOk ? (
        <div style={miniCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Market marker</div>
            <div style={{ opacity: 0.85 }}>{formatNum(data.markerDeg)}°</div>
          </div>

          {Array.isArray(data.nextBoundaries) && data.nextBoundaries.length ? (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {data.nextBoundaries.slice(0, 4).map((b: any) => (
                <div
                  key={b.angle}
                  style={{ fontSize: 12, opacity: 0.9, display: "flex", justifyContent: "space-between", gap: 10 }}
                >
                  <span>{b.angle}° next</span>
                  <span>
                    {String(b.at).slice(0, 19).replace("T", " ")} ({b.inHours}h)
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(data.targets ?? []).map((t: any) => (
          <div key={t.angle} style={miniCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 600 }}>{t.angle}°</div>
              <div style={{ opacity: 0.85 }}>Δ√ = {formatNum(t.deltaSqrt)}</div>
            </div>

            <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12 }}>
              <div>
                Up: <strong>{formatNum(t.up)}</strong>
              </div>
              {t.down != null ? (
                <div>
                  Down: <strong>{formatNum(t.down)}</strong>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div style={helpStyle}>
        Basic read: angles are “structure.” The marker is “timing.” Targets are “levels.” You’re watching where timing +
        levels converge.
      </div>
    </div>
  );
}

function PersonalPanel({ data }: { data: any }) {
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        Anchor: <strong>{String(data.anchorDateTime)}</strong>
      </div>
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        Cycle: <strong>{formatNum(data.cycleDays)}</strong> days
      </div>

      <div style={miniCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 600 }}>Now position</div>
          <div style={{ opacity: 0.85 }}>{formatNum(data.markerDeg)}°</div>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
          Cycle progress: <strong>{Math.round((data.progress01 ?? 0) * 100)}%</strong>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(data.nextBoundaries ?? []).map((b: any) => (
          <div key={b.angle} style={miniCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 600 }}>{b.angle}° next</div>
              <div style={{ opacity: 0.85 }}>{String(b.at)}</div>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
              In: <strong>{b.inHours}</strong> hours
            </div>
          </div>
        ))}
      </div>

      <div style={helpStyle}>Personal use: you’re tracking context shifts as you cross key angles.</div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function parseAnglesCsv(csv: string): number[] {
  const parts = String(csv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const nums = parts
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n))
    .map((n) => ((n % 360) + 360) % 360);

  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

/**
 * ✅ 0° at WEST, increasing clockwise:
 * 0° West, 90° North, 180° East, 270° South
 */
function polarToXY_West0_CW(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg + 180) * Math.PI) / 180;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

function wedgePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const p1 = polarToXY_West0_CW(cx, cy, r, startDeg);
  const p2 = polarToXY_West0_CW(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  return [`M ${cx} ${cy}`, `L ${p1.x} ${p1.y}`, `A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`, "Z"].join(" ");
}

function formatNum(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  return x.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function precheckBadgeTone(tone: "good" | "warn" | "bad"): React.CSSProperties {
  if (tone === "good") return { background: "rgba(46, 204, 113, 0.12)", color: "rgba(255,255,255,0.92)" };
  if (tone === "warn") return { background: "rgba(241, 196, 15, 0.14)", color: "rgba(255,255,255,0.92)" };
  return { background: "rgba(231, 76, 60, 0.14)", color: "rgba(255,255,255,0.92)" };
}

/* -------------------- Styles -------------------- */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#1B1F24",
  padding: "24px 12px",
  display: "flex",
  justifyContent: "center",
  color: "#EDE3CC",
  fontFamily: "system-ui",
};

const wrapStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1100,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  background: "#222933",
  borderRadius: 16,
  padding: "12px 14px",
  border: "1px solid rgba(58,69,80,0.9)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1.2fr 1fr",
  gap: 14,
};

const panelStyle: CSSProperties = {
  background: "#243039",
  borderRadius: 20,
  border: "1px solid rgba(58,69,80,0.9)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
  overflow: "hidden",
  minHeight: 420,
};

const panelHeaderStyle: CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid rgba(58,69,80,0.6)",
  fontWeight: 700,
  letterSpacing: 0.2,
};

const inputStyle: CSSProperties = {
  background: "#1B1F24",
  border: "1px solid #3a4550",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#EDE3CC",
  fontSize: 13,
  outline: "none",
};

const buttonStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid #3a4550",
  borderRadius: 999,
  padding: "7px 12px",
  color: "#EDE3CC",
  fontSize: 12,
};

const segWrapStyle: CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(58,69,80,0.9)",
  borderRadius: 999,
  overflow: "hidden",
};

const segBtnStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#EDE3CC",
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
  opacity: 0.8,
};

const segBtnActiveStyle: CSSProperties = {
  background: "rgba(237,227,204,0.12)",
  opacity: 1,
};

const helpStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  lineHeight: 1.4,
  opacity: 0.85,
};

const codeStyle: CSSProperties = {
  background: "rgba(0,0,0,0.25)",
  padding: "2px 6px",
  borderRadius: 6,
  border: "1px solid rgba(58,69,80,0.6)",
};

const checkRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 12,
  fontSize: 12,
};

const miniCardStyle: CSSProperties = {
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(58,69,80,0.6)",
  borderRadius: 14,
  padding: 12,
};

const errorStyle: CSSProperties = {
  background: "rgba(255, 80, 80, 0.12)",
  border: "1px solid rgba(255, 80, 80, 0.35)",
  borderRadius: 12,
  padding: 10,
  color: "#FFB0B0",
};

const warnStyle: CSSProperties = {
  background: "rgba(241, 196, 15, 0.12)",
  border: "1px solid rgba(241, 196, 15, 0.35)",
  borderRadius: 12,
  padding: 10,
  color: "rgba(237,227,204,0.95)",
};

/* -------------------- Pivot Precheck Styles -------------------- */

const precheckPanelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 12,
  marginBottom: 10,
};

const precheckHeaderRow: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};

const precheckTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: 0.2,
};

const precheckSubtitle: CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  marginTop: 4,
  lineHeight: 1.35,
  maxWidth: 520,
};

const precheckScoreBox: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8,
};

const precheckBadgeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.6,
  borderRadius: 999,
  padding: "6px 10px",
  border: "1px solid rgba(255,255,255,0.12)",
};

const precheckGrid: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const precheckRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "10px 10px",
};

const precheckRowLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
};

const precheckRowHint: CSSProperties = {
  fontSize: 11,
  opacity: 0.7,
  marginTop: 3,
  lineHeight: 1.35,
  maxWidth: 520,
};

const precheckSegWrap: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const precheckSegBtn: CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(237,227,204,0.95)",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
  minWidth: 38,
  textAlign: "center",
};

const precheckSegBtnActive: CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.22)",
};

const precheckRules: CSSProperties = {
  marginTop: 10,
  background: "rgba(0,0,0,0.14)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 10,
};

const precheckFooterRow: CSSProperties = {
  marginTop: 10,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const btnGhost: CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(237,227,204,0.95)",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};
