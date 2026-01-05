// src/app/chart/page.tsx
"use client";

import { useMemo, useState, type CSSProperties } from "react";

type Mode = "market" | "personal";

type GannResponse =
  | { ok: true; mode: Mode; input: any; data: any }
  | { ok: false; error: string; retryAfterSeconds?: number };

const DEFAULT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function ChartPage() {
  const [mode, setMode] = useState<Mode>("market");

  // MARKET inputs
  const [symbol, setSymbol] = useState("SOL-USD");
  const [anchorPrice, setAnchorPrice] = useState("200"); // string input
  const [tickSize, setTickSize] = useState("0.01");
  const [anglesCsv, setAnglesCsv] = useState(DEFAULT_ANGLES.join(","));
  const [includeDownside, setIncludeDownside] = useState(true);

  // PERSONAL inputs
  const [anchorDateTime, setAnchorDateTime] = useState(() => {
    // default: a stable anchor, user can change
    return "1990-01-24T01:39";
  });
  const [cycleDays, setCycleDays] = useState("365.2425"); // solar year default
  const [personalAnglesCsv, setPersonalAnglesCsv] = useState(DEFAULT_ANGLES.join(","));

  const [res, setRes] = useState<GannResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const angles = useMemo(() => parseAnglesCsv(mode === "market" ? anglesCsv : personalAnglesCsv), [
    mode,
    anglesCsv,
    personalAnglesCsv,
  ]);

  async function run() {
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
          </div>

          <button type="button" onClick={run} style={{ ...buttonStyle, paddingInline: 14 }}>
            {loading ? "Running…" : "Run"}
          </button>
        </div>

        <div style={gridStyle}>
          {/* Inputs */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>{cardTitle} Inputs</div>

            {mode === "market" ? (
              <>
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

                <div style={helpStyle}>
                  Targets are computed using the classic Square-of-9 square-root step:
                  <br />
                  <code style={codeStyle}>target = (sqrt(anchor) ± (angle/180))²</code>
                </div>
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

          {/* Visualization */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>Angle Ring</div>

            {res?.ok ? (
              <AngleRing
                angles={angles}
                markerDeg={res.data?.markerDeg ?? null}
                subtitle={
                  mode === "market"
                    ? `Anchor: ${formatNum(res.data.anchor)} ${res.input.symbol ? `(${res.input.symbol})` : ""}`
                    : `Now @ ${formatNum(res.data.markerDeg)}° of cycle`
                }
              />
            ) : (
              <div style={{ opacity: 0.8, padding: 12 }}>
                Run to generate the ring and targets.
              </div>
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
              <div style={{ opacity: 0.8, padding: 12 }}>
                Outputs appear here.
              </div>
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
            style={{
              ...segBtnStyle,
              ...(active ? segBtnActiveStyle : null),
            }}
          >
            {o.label}
          </button>
        );
      })}
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

  const spokes = angles.map((deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const x2 = cx + Math.cos(a) * r;
    const y2 = cy + Math.sin(a) * r;
    return { deg, x2, y2 };
  });

  const marker = markerDeg == null ? null : polarToXY(cx, cy, r, markerDeg);

  return (
    <div style={{ padding: 12 }}>
      {subtitle ? <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>{subtitle}</div> : null}

      <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(237,227,204,0.25)" strokeWidth={2} />

        {/* spokes */}
        {spokes.map((s) => (
          <g key={s.deg}>
            <line
              x1={cx}
              y1={cy}
              x2={s.x2}
              y2={s.y2}
              stroke="rgba(237,227,204,0.15)"
              strokeWidth={2}
            />
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
    </div>
  );
}

function TargetsPanel({ data }: { data: any }) {
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        Anchor: <strong>{formatNum(data.anchor)}</strong>
      </div>

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
        Interpretation (basic): 45°/90°/180°/270° targets are common “reaction” levels. Use them as reference levels,
        not certainty.
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

      <div style={helpStyle}>
        Personal use (basic): treat the boundaries as “chapter shifts.” You’re not predicting events — you’re tracking
        when your internal context tends to change.
      </div>
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

  // de-dupe & sort
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

function formatNum(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return String(n);
  return x.toLocaleString(undefined, { maximumFractionDigits: 6 });
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
  cursor: "pointer",
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
