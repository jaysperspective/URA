// src/components/ura/URAFoundationPanel.tsx
"use client";

import React from "react";
import { metaForPhase, type URAPhaseMeta, type PhaseId } from "@/lib/ura/ontology";

type Props = {
  solarPhaseId: number | null;
  solarProgress01: number | null;
  sunText: string;

  // Back-compat: some pages may already pass an "ontology" object
  ontology: any | null;

  // Optional: for Phase 6 UI control later (doesn't affect others)
  phase6Aspect?: "oya" | "ogun";

  // Optional: lets you show "As of 1/5, 10:51 AM" when you have it
  asOfLabel?: string;
};

function pct(n: number | null) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}

/**
 * Normalize "ontology" input:
 * - Prefer the passed-in ontology object if it looks valid
 * - Otherwise fall back to canonical metaForPhase(phaseId)
 */
function resolveOntology(
  solarPhaseId: number | null,
  ontology: any | null
): URAPhaseMeta | null {
  // If it already looks like URAPhaseMeta-ish, use it
  if (
    ontology &&
    typeof ontology === "object" &&
    typeof ontology.id === "number" &&
    ontology.orisha &&
    ontology.planet
  ) {
    return ontology as URAPhaseMeta;
  }

  // Fall back to canonical meta
  return metaForPhase(solarPhaseId ?? null);
}

function phaseLabel(meta: URAPhaseMeta | null) {
  if (!meta) return "—";
  // Example: "WNTR · Phase 7 — Dissolution"
  // Season isn’t in meta; your microcopy panel already has it.
  return `Phase ${meta.id} — ${meta.title}`;
}

function orishaLabel(meta: URAPhaseMeta | null, phase6Aspect?: "oya" | "ogun") {
  if (!meta?.orisha?.key) return "—";

  // Phase 6 dual handling if your ontology.ts uses secondaryKey/dual
  const primary = meta.orisha.key;
  const secondary = (meta.orisha as any).secondaryKey as string | undefined;
  const isDual = Boolean((meta.orisha as any).dual) || Boolean(secondary);

  if (meta.id === 6 && isDual) {
    // If the caller specifies a lens, show it; otherwise show dual
    if (phase6Aspect === "oya") return "Oya (Clear)";
    if (phase6Aspect === "ogun") return "Ogun (Forge)";
    return secondary ? `${primary} ⇄ ${secondary}` : `${primary} ⇄ Ogun`;
  }

  return primary;
}

export default function URAFoundationPanel({
  solarPhaseId,
  solarProgress01,
  sunText,
  ontology,
  phase6Aspect,
  asOfLabel,
}: Props) {
  const meta = resolveOntology(solarPhaseId, ontology);

  return (
    <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
            URA Foundation
          </div>

          <div className="mt-2 text-sm text-[#1F1B16]/90">
            <span className="font-semibold">Solar</span>{" "}
            {solarPhaseId ? `Phase ${solarPhaseId}` : "—"}{" "}
            <span className="text-[#403A32]/70">• {pct(solarProgress01)}</span>
          </div>

          {asOfLabel ? (
            <div className="mt-1 text-xs text-[#403A32]/65">As of {asOfLabel}</div>
          ) : null}
        </div>

        {/* Compact identity chip */}
        <div className="rounded-full border border-black/10 bg-[#F4EFE6] px-3 py-1 text-xs text-[#403A32]/80">
          {phaseLabel(meta)}
        </div>
      </div>

      <div className="mt-2 text-sm text-[#403A32]/75">
        <span className="font-semibold text-[#1F1B16]">Sun</span>: {sunText}
      </div>

      {!meta ? (
        <div className="mt-4 text-sm text-[#403A32]/75">
          Ontology unavailable.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Function */}
          <div>
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
              Function
            </div>
            <div className="mt-1 text-sm font-semibold text-[#1F1B16]">
              {meta.function}
            </div>
          </div>

          {/* Ecology / Psyche */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                Ecology
              </div>
              <div className="mt-2 text-sm text-[#403A32]/85">
                {meta.ecology}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                Psyche
              </div>
              <div className="mt-2 text-sm text-[#403A32]/85">
                {meta.psyche}
              </div>
            </div>
          </div>

          {/* Orisha */}
          <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                Modal Intelligence
              </div>

              {meta.id === 6 ? (
                <div className="text-[11px] text-[#403A32]/70">
                  {phase6Aspect ? "Lens: " + phase6Aspect.toUpperCase() : "Dual"}
                </div>
              ) : null}
            </div>

            <div className="mt-2 text-sm text-[#1F1B16]/90">
              <span className="font-semibold">
                {orishaLabel(meta, phase6Aspect)}
              </span>{" "}
              — {meta.orisha?.modality}
            </div>

            <div className="mt-2 text-xs text-[#403A32]/75">
              Distortion: {meta.orisha?.distortion}
            </div>

            <div className="mt-2 text-xs text-[#403A32]/85">
              Practice:{" "}
              <span className="font-semibold">{meta.orisha?.practice}</span>
            </div>
          </div>

          {/* Planet */}
          <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
              Planet Force Overlay
            </div>
            <div className="mt-2 text-sm text-[#1F1B16]/90">
              <span className="font-semibold">{meta.planet?.key}</span> —{" "}
              {meta.planet?.force}
            </div>
            <div className="mt-2 text-xs text-[#403A32]/75">
              Distortion: {meta.planet?.distortion}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
