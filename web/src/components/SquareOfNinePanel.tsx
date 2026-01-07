// src/components/SquareOfNinePanel.tsx
"use client";

import React, { useMemo } from "react";

type Props = {
  size?: number; // must be odd; default 19
  highlightNumbers?: number[]; // optional highlights
  title?: string;
  subtitle?: string;
};

export default function SquareOfNinePanel({
  size = 19,
  highlightNumbers = [],
  title = "Square of Nine",
  subtitle = "Classic spiral grid (1 at center). Use for level mapping / angle resonance.",
}: Props) {
  const s = useMemo(() => (size % 2 === 1 ? size : size + 1), [size]);

  const grid = useMemo(() => buildSquareOfNine(s), [s]);
  const highlightSet = useMemo(() => new Set(highlightNumbers.map((n) => Math.round(Number(n)))), [highlightNumbers]);

  return (
    <div style={panel}>
      <div style={topRow}>
        <div>
          <div style={panelTitle}>{title}</div>
          <div style={panelSub}>{subtitle}</div>
        </div>
        <div style={pillMuted}>{s}×{s}</div>
      </div>

      <div style={wrap}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${s}, minmax(0, 1fr))`,
            gap: 2,
          }}
        >
          {grid.flat().map((n, i) => {
            const active = highlightSet.has(n);
            return (
              <div
                key={i}
                style={{
                  ...cell,
                  ...(active ? cellActive : null),
                }}
                title={String(n)}
              >
                {n}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Build a classic spiral:
 * - center is 1
 * - spiral outward (right, up, left, down), increasing step lengths
 */
function buildSquareOfNine(size: number) {
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);

  let x = cx;
  let y = cy;

  let val = 1;
  grid[y][x] = val;

  // Spiral directions: right, up, left, down
  const dirs = [
    [1, 0],
    [0, -1],
    [-1, 0],
    [0, 1],
  ] as const;

  let stepLen = 1;

  while (val < size * size) {
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = dirs[d];

      // Increase step length after completing 2 directions
      const steps = stepLen;
      for (let i = 0; i < steps; i++) {
        if (val >= size * size) break;
        x += dx;
        y += dy;
        val += 1;
        if (grid[y] && typeof grid[y][x] !== "undefined") {
          grid[y][x] = val;
        }
      }

      if (d === 1 || d === 3) stepLen += 1;
    }
  }

  return grid;
}

/* ---------- styles ---------- */

const panel: React.CSSProperties = {
  background: "#243039",
  borderRadius: 20,
  border: "1px solid rgba(58,69,80,0.9)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
  overflow: "hidden",
};

const topRow: React.CSSProperties = {
  padding: 14,
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "flex-start",
  borderBottom: "1px solid rgba(58,69,80,0.6)",
};

const panelTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.3,
  color: "#EDE3CC",
};

const panelSub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  lineHeight: 1.4,
  opacity: 0.78,
  color: "#EDE3CC",
  maxWidth: 820,
};

const pillMuted: React.CSSProperties = {
  border: "1px solid rgba(58,69,80,0.9)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  opacity: 0.85,
  color: "#EDE3CC",
  background: "rgba(0,0,0,0.14)",
};

const wrap: React.CSSProperties = {
  padding: 12,
};

const cell: React.CSSProperties = {
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(58,69,80,0.35)",
  borderRadius: 6,
  minHeight: 26,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 800,
  color: "rgba(237,227,204,0.86)",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
};

const cellActive: React.CSSProperties = {
  background: "rgba(237,227,204,0.12)",
  border: "1px solid rgba(237,227,204,0.30)",
  color: "#EDE3CC",
};
