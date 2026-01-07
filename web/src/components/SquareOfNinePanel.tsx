// src/components/SquareOfNinePanel.tsx
"use client";

import React from "react";

/* -------------------- Types -------------------- */

export type SquareOfNineTarget = {
  angle: number;
  up: number;
  down: number;
  deltaSqrt?: number;
};

type Props = {
  anchor: number;
  tickSize: number;
  targets: SquareOfNineTarget[];
  currentPrice: number | null;
};

/* -------------------- Component -------------------- */

export default function SquareOfNinePanel({
  anchor,
  tickSize,
  targets,
  currentPrice,
}: Props) {
  return (
    <div style={panelStyle}>
      <div style={titleStyle}>Square of 9</div>

      <div style={metaStyle}>
        <div>
          Anchor: <strong>{format(anchor)}</strong>
        </div>
        <div>
          Tick: <strong>{tickSize}</strong>
        </div>
        {currentPrice != null && (
          <div>
            Current: <strong>{format(currentPrice)}</strong>
          </div>
        )}
      </div>

      <div style={gridStyle}>
        {targets.map((t) => (
          <div key={t.angle} style={cellStyle}>
            <div style={angleStyle}>{t.angle}°</div>
            <div style={rowStyle}>
              <span>Up</span>
              <strong>{format(t.up)}</strong>
            </div>
            <div style={rowStyle}>
              <span>Down</span>
              <strong>{format(t.down)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div style={noteStyle}>
        Square of 9 expresses price as angular distance from the anchor.  
        Balance comes from <em>structure</em>, not extremes.
      </div>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function format(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/* -------------------- Styles -------------------- */

const panelStyle: React.CSSProperties = {
  border: "1px solid rgba(237,227,204,0.25)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(0,0,0,0.18)",
};

const titleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 13,
  marginBottom: 8,
};

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.85,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
  gap: 10,
};

const cellStyle: React.CSSProperties = {
  border: "1px solid rgba(237,227,204,0.2)",
  borderRadius: 10,
  padding: 8,
  fontSize: 12,
};

const angleStyle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 4,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
};

const noteStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 11,
  opacity: 0.7,
};
