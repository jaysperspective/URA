"use client";

import { PHASES } from "./carouselData";

function FieldGuideItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: "rgba(36, 62, 54, 0.6)" }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--ura-text-muted)" }}
      >
        {label}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--ura-text-secondary)" }}>
        {value}
      </div>
    </div>
  );
}

export default function PhaseAccordion({
  expandedPhase,
  onToggle,
}: {
  expandedPhase: number | null;
  onToggle: (id: number | null) => void;
}) {
  return (
    <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
      {PHASES.map((phase) => (
        <div
          key={phase.id}
          className="rounded-lg overflow-hidden"
          style={{
            background: "rgba(46, 74, 65, 0.7)",
            border: "1px solid var(--ura-border-subtle)",
          }}
        >
          <button
            onClick={() => onToggle(expandedPhase === phase.id ? null : phase.id)}
            className="w-full px-4 py-3 text-left flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-medium" style={{ color: "var(--ura-text-primary)" }}>
                Phase {phase.id} — {phase.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--ura-text-muted)" }}>
                {phase.range} · {phase.functionLine}
              </div>
            </div>
            <div
              className="text-xs px-2 py-1 rounded-full"
              style={{
                background: expandedPhase === phase.id ? "var(--ura-accent-primary)" : "transparent",
                color: expandedPhase === phase.id ? "var(--ura-bg-primary)" : "var(--ura-text-muted)",
                border: expandedPhase === phase.id ? "none" : "1px solid var(--ura-border-medium)",
              }}
            >
              {expandedPhase === phase.id ? "Close" : "Open"}
            </div>
          </button>

          {expandedPhase === phase.id && (
            <div className="px-4 pb-4 space-y-3">
              <div
                className="text-sm leading-relaxed"
                style={{ color: "var(--ura-text-secondary)" }}
              >
                {phase.gist}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FieldGuideItem label="Function" value={phase.functionLine} />
                <FieldGuideItem label="Ecology" value={phase.ecology} />
                <FieldGuideItem label="Psyche" value={phase.psyche} />
                <FieldGuideItem label="Distortion" value={phase.distortion} />
              </div>

              <div
                className="rounded-lg px-3 py-2"
                style={{ background: "rgba(36, 62, 54, 0.8)" }}
              >
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--ura-text-muted)" }}
                >
                  Right Participation
                </div>
                <div
                  className="text-sm mt-1"
                  style={{ color: "var(--ura-accent-primary)" }}
                >
                  {phase.participation}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
