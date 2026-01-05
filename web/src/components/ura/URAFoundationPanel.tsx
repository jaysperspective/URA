// src/components/ura/URAFoundationPanel.tsx
"use client";

import React from "react";

type Props = {
  solarPhaseId: number | null;
  solarProgress01: number | null;
  sunText: string;
  ontology: any | null;
};

function pct(n: number | null) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}

export default function URAFoundationPanel({
  solarPhaseId,
  solarProgress01,
  sunText,
  ontology,
}: Props) {
  return (
    <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-6">
      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
        URA Foundation
      </div>

      <div className="mt-2 text-sm text-[#1F1B16]/90">
        <span className="font-semibold">Solar Phase</span>{" "}
        {solarPhaseId ? `Phase ${solarPhaseId}` : "—"}{" "}
        <span className="text-[#403A32]/70">• {pct(solarProgress01)}</span>
      </div>

      <div className="mt-2 text-sm text-[#403A32]/75">
        <span className="font-semibold text-[#1F1B16]">Sun</span>: {sunText}
      </div>

      {!ontology ? (
        <div className="mt-4 text-sm text-[#403A32]/75">Ontology unavailable.</div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
              Function
            </div>
            <div className="mt-1 text-sm font-semibold text-[#1F1B16]">
              {ontology.function}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                Ecology
              </div>
              <div className="mt-2 text-sm text-[#403A32]/85">
                {ontology.ecology}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                Psyche
              </div>
              <div className="mt-2 text-sm text-[#403A32]/85">
                {ontology.psyche}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
              Orisha Modality
            </div>
            <div className="mt-2 text-sm text-[#1F1B16]/90">
              <span className="font-semibold">{ontology.orisha?.key}</span> —{" "}
              {ontology.orisha?.modality}
            </div>
            <div className="mt-2 text-xs text-[#403A32]/75">
              Distortion: {ontology.orisha?.distortion}
            </div>
            <div className="mt-2 text-xs text-[#403A32]/85">
              Practice: <span className="font-semibold">{ontology.orisha?.practice}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
              Planet Force Overlay
            </div>
            <div className="mt-2 text-sm text-[#1F1B16]/90">
              <span className="font-semibold">{ontology.planet?.key}</span> —{" "}
              {ontology.planet?.force}
            </div>
            <div className="mt-2 text-xs text-[#403A32]/75">
              Distortion: {ontology.planet?.distortion}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
