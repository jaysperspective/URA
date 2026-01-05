// src/components/ura/URAFoundationCard.tsx
"use client";

import React from "react";

type Props = {
  phaseId: number | null;
  title?: string | null;       // keep your existing label style outside if desired
  ontology: any | null;        // from /api/ura/context
  progress01?: number | null;
};

export default function URAFoundationCard({ phaseId, ontology, progress01 }: Props) {
  const p = typeof phaseId === "number" ? phaseId : null;
  const pct = typeof progress01 === "number" ? Math.round(progress01 * 100) : null;

  return (
    <div className="rounded-2xl border border-[#2a241d] bg-[#0f0d0a] p-6">
      <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
        URA • Foundation
      </div>

      <div className="mt-2 text-[18px] text-[#efe6d8]">
        Solar Phase {p ?? "—"}{" "}
        {pct != null ? <span className="text-[#8f7f6a]">• {pct}%</span> : null}
      </div>

      {!ontology ? (
        <div className="mt-3 text-[12px] text-[#8f7f6a]">Ontology unavailable.</div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-[11px] text-[#b9a88f]">Function</div>
            <div className="text-[13px] text-[#efe6d8]">{ontology.function}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#201a13] bg-black/20 p-4">
              <div className="text-[11px] text-[#b9a88f]">Ecology</div>
              <div className="mt-1 text-[13px] text-[#d9cfbf]">{ontology.ecology}</div>
            </div>

            <div className="rounded-xl border border-[#201a13] bg-black/20 p-4">
              <div className="text-[11px] text-[#b9a88f]">Psyche</div>
              <div className="mt-1 text-[13px] text-[#d9cfbf]">{ontology.psyche}</div>
            </div>
          </div>

          <div className="rounded-xl border border-[#201a13] bg-black/20 p-4">
            <div className="text-[11px] text-[#b9a88f]">Orisha modality</div>
            <div className="mt-1 text-[13px] text-[#efe6d8]">
              <span className="text-[#c7b9a6]">{ontology.orisha?.key}</span>{" "}
              — {ontology.orisha?.modality}
            </div>
            <div className="mt-2 text-[12px] text-[#8f7f6a]">
              Distortion: {ontology.orisha?.distortion}
            </div>
            <div className="mt-2 text-[12px] text-[#c7b9a6]">
              Practice: {ontology.orisha?.practice}
            </div>
          </div>

          <div className="rounded-xl border border-[#201a13] bg-black/20 p-4">
            <div className="text-[11px] text-[#b9a88f]">Planet force overlay</div>
            <div className="mt-1 text-[13px] text-[#efe6d8]">
              <span className="text-[#c7b9a6]">{ontology.planet?.key}</span>{" "}
              — {ontology.planet?.force}
            </div>
            <div className="mt-2 text-[12px] text-[#8f7f6a]">
              Distortion: {ontology.planet?.distortion}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
