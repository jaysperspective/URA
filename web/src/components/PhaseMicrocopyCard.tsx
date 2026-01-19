// src/components/PhaseMicrocopyCard.tsx
"use client";

import { useMemo, useState } from "react";
import type { PhaseMicrocopy, PhaseId } from "@/lib/phaseMicrocopy";
import { themeForPhase, BASE as C } from "@/lib/phaseTheme";

type Tone = "dark" | "linen";

function clampPhaseId(v: any): PhaseId {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1 && n <= 8) return n as PhaseId;
  return 1 as PhaseId;
}

export default function PhaseMicrocopyCard({
  copy,
  defaultExpanded = false,
  // journaling UI is removed globally; keep prop for back-compat
  showJournal = false,
  showActionHint = true,
  tone = "dark",
  showPhaseChip = true,
}: {
  copy: PhaseMicrocopy;
  defaultExpanded?: boolean;
  showJournal?: boolean; // accepted but ignored
  showActionHint?: boolean;
  tone?: Tone;
  showPhaseChip?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const isDark = tone === "dark";

  // Phase-aware theme derived from copy.id (safe 1..8)
  const phaseId = useMemo(() => clampPhaseId(copy.id), [copy.id]);
  const theme = useMemo(() => themeForPhase(phaseId), [phaseId]);

  const cardClass = isDark
    ? "rounded-2xl border border-[#E2D9CC]/20 bg-[#121212]/60 backdrop-blur px-5 py-4"
    : "rounded-2xl border px-5 py-4";

  const cardStyle: React.CSSProperties | undefined = isDark
    ? undefined
    : {
        background: "rgba(244,235,221,0.88)",
        borderColor: "rgba(31,36,26,0.16)",
        boxShadow: "0 10px 40px rgba(31,36,26,0.10)",
      };

  const text = {
    title: isDark ? "#F4EFE6" : C.ink,
    muted: isDark ? "rgba(244,239,230,0.70)" : C.inkMuted,
    soft: isDark ? "rgba(244,239,230,0.55)" : C.inkSoft,
    border: isDark ? "rgba(226,217,204,0.22)" : C.border,
    btnBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(31,36,26,0.06)",
    btnBgHover: isDark ? "rgba(255,255,255,0.10)" : "rgba(31,36,26,0.10)",
  };

  // Phase accents: keep them subtle + calendar-native.
  const accent = isDark ? "rgba(226,217,204,0.50)" : theme.accentDeep;
  const accentSoft = isDark ? "rgba(226,217,204,0.10)" : theme.accentSoft;

  const phaseChipStyle: React.CSSProperties = isDark
    ? {
        borderColor: "rgba(226,217,204,0.24)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(244,239,230,0.80)",
      }
    : {
        borderColor: C.border,
        background: `linear-gradient(180deg, rgba(244,235,221,0.90) 0%, ${accentSoft} 160%)`,
        color: C.ink,
      };

  const detailsBtnStyle: React.CSSProperties = {
    color: text.muted,
    borderColor: isDark ? text.border : accent,
    background: isDark
      ? text.btnBg
      : `linear-gradient(180deg, ${text.btnBg} 0%, ${accentSoft} 170%)`,
  };

  const detailsBtnHover = isDark
    ? text.btnBgHover
    : `linear-gradient(180deg, ${text.btnBgHover} 0%, ${accentSoft} 170%)`;

  // showJournal is intentionally ignored now (journaling UI removed globally)
  void showJournal;

  return (
    <section className={cardClass} style={cardStyle}>
      {/* subtle phase bar */}
      <div
        className="mb-3 h-[3px] w-full rounded-full"
        style={{ background: isDark ? "rgba(226,217,204,0.16)" : accentSoft }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: expanded ? "100%" : "55%", background: accent }}
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold tracking-tight" style={{ color: text.title }}>
              {copy.season} · Phase {phaseId}
            </div>

            {showPhaseChip && (
              <span
                className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px]"
                style={phaseChipStyle}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: accent }} />
                <span style={{ letterSpacing: "0.14em", fontWeight: 800 }}>
                  PHASE {phaseId}
                </span>
              </span>
            )}
          </div>

          <div className="text-sm mt-1" style={{ color: text.muted }}>
            {copy.oneLine}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-lg border px-3 py-1 text-xs hover:opacity-95"
          style={detailsBtnStyle}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = detailsBtnHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              detailsBtnStyle.background as string;
          }}
          aria-expanded={expanded}
        >
          {expanded ? "Hide" : "Details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 text-sm leading-relaxed" style={{ color: text.muted }}>
          {copy.description}
        </div>
      )}

      {showActionHint && copy.actionHint && (
        <div className="mt-3 text-xs" style={{ color: text.soft }}>
          <span style={{ color: text.soft }}>Action:</span>{" "}
          <span style={{ color: text.muted }}>{copy.actionHint}</span>
        </div>
      )}

      {copy.footer ? (
        <div className="mt-3 text-xs" style={{ color: text.soft }}>
          {copy.footer}
        </div>
      ) : null}
    </section>
  );
}
