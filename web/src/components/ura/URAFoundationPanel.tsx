// src/components/ura/URAFoundationPanel.tsx
"use client";

import React from "react";
import { microcopyForPhase, type PhaseId, type Phase6Aspect } from "@/lib/phaseMicrocopy";

type Props = {
  solarPhaseId: number | null;
  solarProgress01: number | null;
  sunText: string;

  // accepted for back-compat; not required for rendering
  ontology: any | null;

  phase6Aspect?: Phase6Aspect;
  asOfLabel?: string;
};

function pct(n: number | null) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}

function asPhaseId(n: number | null): PhaseId | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  const x = Math.round(n);
  if (x < 1 || x > 8) return null;
  return x as PhaseId;
}

export default function URAFoundationPanel({
  solarPhaseId,
  solarProgress01,
  sunText,
  ontology, // intentionally unused (back-compat)
  phase6Aspect,
  asOfLabel,
}: Props) {
  const pid = asPhaseId(solarPhaseId);
  const mc = pid ? microcopyForPhase(pid, pid === 6 ? { phase6Aspect } : undefined) : null;

  // keep lint happy; ontology stays accepted
  void ontology;

  return (
    <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
            URA Foundation
          </div>

          <div className="mt-2 text-sm text-[#1F1B16]/90">
            <span className="font-semibold">Solar</span>{" "}
            {pid ? `Phase ${pid}` : "—"}{" "}
            <span className="text-[#403A32]/70">• {pct(solarProgress01)}</span>
          </div>

          {asOfLabel ? (
            <div className="mt-1 text-xs text-[#403A32]/65">As of {asOfLabel}</div>
          ) : null}
        </div>

        <div className="rounded-full border border-black/10 bg-[#F4EFE6] px-3 py-1 text-xs text-[#403A32]/80">
          {mc ? `${mc.season} · Phase ${mc.id}` : "—"}
        </div>
      </div>

      <div className="mt-2 text-sm text-[#403A32]/75">
        <span className="font-semibold text-[#1F1B16]">Sun</span>: {sunText}
      </div>

      {!mc ? (
        <div className="mt-4 text-sm text-[#403A32]/75">Foundation unavailable.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Phase Lens */}
          <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
              Phase lens
            </div>

            <div className="mt-2 text-sm text-[#1F1B16]/90">
              <span className="font-semibold">{mc.season} · Phase {mc.id}</span>
            </div>

            <div className="mt-2 text-sm text-[#403A32]/85">{mc.oneLine}</div>

            <div className="mt-3 text-sm leading-relaxed text-[#403A32]/85">
              {mc.description}
            </div>

            {mc.actionHint ? (
              <div className="mt-3 text-sm text-[#403A32]/85">
                <span className="font-semibold text-[#1F1B16]/90">Action:</span>{" "}
                <span className="font-semibold">{mc.actionHint}</span>
              </div>
            ) : null}
          </div>

          {mc.footer ? (
            <div className="text-xs text-[#403A32]/70">{mc.footer}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
