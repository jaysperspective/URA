// src/components/PhaseMicrocopyCard.tsx
"use client";

import { useMemo, useState } from "react";
import type { PhaseMicrocopy } from "@/lib/phaseMicrocopy";

type Tone = "dark" | "linen";

export default function PhaseMicrocopyCard({
  copy,
  defaultExpanded = false,
  showJournal = true,
  showActionHint = true,
  tone = "dark",
}: {
  copy: PhaseMicrocopy;
  defaultExpanded?: boolean;
  showJournal?: boolean;
  showActionHint?: boolean;
  tone?: Tone;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [journal, setJournal] = useState("");

  const journalId = useMemo(
    () => `journal-${copy.season}-${copy.id}-${copy.orisha}`.toLowerCase(),
    [copy]
  );

  const isDark = tone === "dark";

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
    title: isDark ? "#F4EFE6" : "#1F241A",
    muted: isDark ? "rgba(244,239,230,0.70)" : "rgba(31,36,26,0.72)",
    soft: isDark ? "rgba(244,239,230,0.55)" : "rgba(31,36,26,0.55)",
    border: isDark ? "rgba(226,217,204,0.22)" : "rgba(31,36,26,0.16)",
    btnBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(31,36,26,0.06)",
    btnBgHover: isDark ? "rgba(255,255,255,0.10)" : "rgba(31,36,26,0.10)",
    inputBg: isDark ? "rgba(0,0,0,0.30)" : "rgba(244,235,221,0.70)",
  };

  return (
    <section className={cardClass} style={cardStyle}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className="text-sm font-semibold tracking-tight"
            style={{ color: text.title }}
          >
            {copy.header}
          </div>
          <div className="text-sm mt-1" style={{ color: text.muted }}>
            {copy.oneLine}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-lg border px-3 py-1 text-xs hover:opacity-95"
          style={{
            color: text.muted,
            borderColor: text.border,
            background: text.btnBg,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = text.btnBgHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = text.btnBg;
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

      {showJournal && (
        <div className="mt-4">
          <div className="text-sm font-medium" style={{ color: text.title }}>
            {copy.journalPrompt}
          </div>
          <div className="text-xs mt-1" style={{ color: text.soft }}>
            {copy.journalHelper}
          </div>

          <textarea
            id={journalId}
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="Write here…"
            className="mt-2 w-full min-h-[110px] rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{
              color: text.title,
              borderColor: text.border,
              background: text.inputBg,
              boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset",
            }}
          />

          {copy.footer && (
            <div className="mt-3 text-xs" style={{ color: text.soft }}>
              {copy.footer}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
