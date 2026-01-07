// src/components/PivotPrecheckPanel.tsx
"use client";

import React, { useMemo, useState } from "react";

type ScoreState = {
  legBirth: 0 | 1 | 2 | 3; // 0–3
  structure: 0 | 1 | 2; // 0–2
  followThrough: 0 | 1 | 2; // 0–2
  timeFit: 0 | 1 | 2; // 0–2
  sanity: 0 | 1; // 0–1
};

export type PivotPrecheckResult = {
  total: number; // 0–10
  autoFail: boolean;
  hardPass: boolean; // strict rule
  recommendedAction: "USE" | "MARGINAL" | "REJECT";
  reasons: string[];
  state: ScoreState;
};

type Props = {
  /** Optional: seed with current values */
  initial?: Partial<ScoreState>;
  /** Optional: let parent read the verdict */
  onChange?: (result: PivotPrecheckResult) => void;
};

const DEFAULTS: ScoreState = {
  legBirth: 2,
  structure: 2,
  followThrough: 1,
  timeFit: 1,
  sanity: 1,
};

export default function PivotPrecheckPanel({ initial, onChange }: Props) {
  const [s, setS] = useState<ScoreState>({ ...DEFAULTS, ...(initial ?? {}) } as ScoreState);

  const result = useMemo<PivotPrecheckResult>(() => {
    const total = s.legBirth + s.structure + s.followThrough + s.timeFit + s.sanity;

    // Auto-fail gates (strict)
    const autoFail = s.legBirth === 0 || s.structure === 0 || s.timeFit === 0;

    const reasons: string[] = [];
    if (s.legBirth === 0) reasons.push("Leg Birth = 0 (bounce/spike/continuation).");
    if (s.structure === 0) reasons.push("Structure = 0 (pivot violated / no confirmation).");
    if (s.timeFit === 0) reasons.push("Time Fit = 0 (cycle doesn’t express cleanly).");

    // Hard pass rule (strict and consistent)
    const hardPass = !autoFail && s.legBirth >= 2 && s.structure === 2 && total >= 7;

    let recommendedAction: PivotPrecheckResult["recommendedAction"] = "REJECT";

    if (hardPass) {
      recommendedAction = "USE";
    } else if (!autoFail && total >= 5) {
      recommendedAction = "MARGINAL";
      if (total < 7) reasons.push("Total < 7 (not strong enough to anchor a cycle).");
      if (s.legBirth < 2) reasons.push("Leg Birth < 2 (too weak / not a clear new leg).");
      if (s.structure < 2) reasons.push("Structure < 2 (not fully confirmed).");
    } else {
      if (!autoFail) reasons.push("Total < 5 (insufficient evidence).");
    }

    return { total, autoFail, hardPass, recommendedAction, reasons, state: s };
  }, [s]);

  React.useEffect(() => {
    onChange?.(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.total, result.autoFail, result.hardPass, result.recommendedAction, s]);

  const badge = useMemo(() => {
    if (result.recommendedAction === "USE") return { text: "USE PIVOT", tone: "good" as const };
    if (result.recommendedAction === "MARGINAL") return { text: "MARGINAL", tone: "warn" as const };
    return { text: "REJECT", tone: "bad" as const };
  }, [result.recommendedAction]);

  return (
    <div style={panel}>
      <div style={headerRow}>
        <div>
          <div style={title}>Pivot Pre-Check</div>
          <div style={subtitle}>Score the candidate pivot before you anchor the cycle.</div>
        </div>

        <div style={scoreBox}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Total</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{result.total}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>/ 10</div>
          </div>

          <div style={{ ...badgeStyle, ...badgeTone(badge.tone) }}>{badge.text}</div>
        </div>
      </div>

      <div style={grid}>
        <ScoreRow
          label="1) Leg Birth"
          hint="Did a new directional leg begin here?"
          value={s.legBirth}
          options={[0, 1, 2, 3]}
          onChange={(v) => setS((p) => ({ ...p, legBirth: v as ScoreState["legBirth"] }))}
        />

        <ScoreRow
          label="2) Structure"
          hint="Higher-low / lower-high confirmation within ~5–10 bars?"
          value={s.structure}
          options={[0, 1, 2]}
          onChange={(v) => setS((p) => ({ ...p, structure: v as ScoreState["structure"] }))}
        />

        <ScoreRow
          label="3) Follow-Through"
          hint="Did price travel meaningfully away (energy / commitment)?"
          value={s.followThrough}
          options={[0, 1, 2]}
          onChange={(v) => setS((p) => ({ ...p, followThrough: v as ScoreState["followThrough"] }))}
        />

        <ScoreRow
          label="4) Time Symmetry Fit"
          hint="Does early base → mid expansion → late exhaustion express cleanly?"
          value={s.timeFit}
          options={[0, 1, 2]}
          onChange={(v) => setS((p) => ({ ...p, timeFit: v as ScoreState["timeFit"] }))}
        />

        <ScoreRow
          label="5) Sanity"
          hint="Does this pivot tell the truth without excuses?"
          value={s.sanity}
          options={[0, 1]}
          onChange={(v) => setS((p) => ({ ...p, sanity: v as ScoreState["sanity"] }))}
        />
      </div>

      <div style={rules}>
        <div style={ruleTitle}>Strict pass rule</div>
        <ul style={ruleList}>
          <li>
            Auto-fail if <b>Leg Birth = 0</b> or <b>Structure = 0</b> or <b>Time Fit = 0</b>
          </li>
          <li>
            Hard pass requires <b>Leg Birth ≥ 2</b>, <b>Structure = 2</b>, and <b>Total ≥ 7</b>
          </li>
        </ul>
      </div>

      {result.reasons.length > 0 && (
        <div style={reasonsBox}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "rgba(255,255,255,0.85)" }}>
            Notes
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 1.5 }}>
            {result.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={footerRow}>
        <button type="button" onClick={() => setS(DEFAULTS)} style={btnGhost}>
          Reset to defaults
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(result, null, 2))} style={btnGhost}>
            Copy verdict JSON
          </button>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", alignSelf: "center" }}>
            (Optional: paste into notes/logs)
          </div>
        </div>
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
    <div style={row}>
      <div>
        <div style={rowLabel}>{props.label}</div>
        <div style={rowHint}>{props.hint}</div>
      </div>

      <div style={segWrap}>
        {props.options.map((opt) => {
          const active = opt === props.value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => props.onChange(opt)}
              style={{ ...segBtn, ...(active ? segBtnActive : null) }}
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

/** styles */
const panel: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 14,
  color: "rgba(255,255,255,0.92)",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: 12,
};

const title: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: 0.2,
};

const subtitle: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.65)",
  marginTop: 3,
  maxWidth: 520,
  lineHeight: 1.35,
};

const scoreBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8,
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.6,
  borderRadius: 999,
  padding: "6px 10px",
  border: "1px solid rgba(255,255,255,0.12)",
};

function badgeTone(tone: "good" | "warn" | "bad"): React.CSSProperties {
  if (tone === "good") return { background: "rgba(46, 204, 113, 0.12)", color: "rgba(255,255,255,0.92)" };
  if (tone === "warn") return { background: "rgba(241, 196, 15, 0.14)", color: "rgba(255,255,255,0.92)" };
  return { background: "rgba(231, 76, 60, 0.14)", color: "rgba(255,255,255,0.92)" };
}

const grid: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "10px 10px",
};

const rowLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
};

const rowHint: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.62)",
  marginTop: 3,
  maxWidth: 520,
  lineHeight: 1.35,
};

const segWrap: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const segBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.85)",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
  minWidth: 38,
  textAlign: "center",
};

const segBtnActive: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.22)",
};

const rules: React.CSSProperties = {
  marginTop: 12,
  background: "rgba(0,0,0,0.14)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 10,
};

const ruleTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
};

const ruleList: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "rgba(255,255,255,0.72)",
  fontSize: 12,
  lineHeight: 1.5,
};

const reasonsBox: React.CSSProperties = {
  marginTop: 10,
  background: "rgba(0,0,0,0.14)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 10,
};

const footerRow: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const btnGhost: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.85)",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};
