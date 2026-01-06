// src/components/ura/URAFoundationPanel.tsx
"use client";

import React from "react";
import { microcopyForPhase, type PhaseId, type Phase6Aspect } from "@/lib/phaseMicrocopy";

type Props = {
  // We keep back-compat with existing callers:
  // - solarPhaseId is what pages already pass (number | null)
  // - ontology is ignored now (still accepted so nothing breaks)
  solarPhaseId: number | null;
  solarProgress01: number | null;
  sunText: string;

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

        {/* Compact identity chip */}
        <div className="rounded-full border border-black/10 bg-[#F4EFE6] px-3 py-1 text-xs text-[#403A32]/80">
          {mc ? `Phase ${mc.id} — ${mc.orisha}` : "—"}
        </div>
      </div>

      <div className="mt-2 text-sm text-[#403A32]/75">
        <span className="font-semibold text-[#1F1B16]">Sun</span>: {sunText}
      </div>

      {!mc ? (
        <div className="mt-4 text-sm text-[#403A32]/75">Foundation unavailable.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Grounded doctrine copy (keeps Orisha name, avoids metaphysical fluff) */}
          <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
              Phase lens
            </div>

            <div className="mt-2 text-sm text-[#1F1B16]/90">
              <span className="font-semibold">{mc.header}</span>
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

          {/* Journal prompt */}
          <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-5 py-4">
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
              Journal
            </div>

            <div className="mt-2 text-sm text-[#1F1B16]/90">
              <span className="font-semibold">{mc.journalPrompt}</span>
            </div>

            <div className="mt-2 text-xs text-[#403A32]/75">{mc.journalHelper}</div>

            <textarea
              className="mt-3 w-full rounded-2xl border border-black/10 bg-[#F8F2E8] px-4 py-3 text-sm text-black placeholder:text-black/40"
              rows={4}
              placeholder="Write here…"
              style={{ WebkitTextFillColor: "rgba(0,0,0,0.92)" }}
            />
          </div>

          {mc.footer ? (
            <div className="text-xs text-[#403A32]/70">{mc.footer}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
