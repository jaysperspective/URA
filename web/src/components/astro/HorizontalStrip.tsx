"use client";

import React from "react";
import { PlanetPos, normalizeToAsc, degToX } from "@/lib/astro/coordinates";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

type Props = {
  ascDeg: number;
  mcDeg: number;
  natalPlanets: PlanetPos[];
  transitPlanets: PlanetPos[];
  width?: number;
  height?: number;
};

export const HorizontalStrip: React.FC<Props> = ({
  ascDeg,
  mcDeg,
  natalPlanets,
  transitPlanets,
  width = 360,
  height = 100,
}) => {
  const barHeight = 40;
  const viewBox = `0 0 ${width} ${height}`;

  const icDeg = (ascDeg + 90) % 360;
  const dscDeg = (ascDeg + 180) % 360;

  const axisXs = {
    ASC: degToX(0, width),
    IC: degToX(90, width),
    DSC: degToX(180, width),
    MC: degToX(270, width),
  };

  const seasons = [
    { label: "SPRING", xStartDeg: 0, xEndDeg: 90 },
    { label: "SUMMER", xStartDeg: 90, xEndDeg: 180 },
    { label: "FALL",   xStartDeg: 180, xEndDeg: 270 },
    { label: "WINTER", xStartDeg: 270, xEndDeg: 360 },
  ];

  const signWidth = width / 12;

  const renderPlanet = (p: PlanetPos, row: "transit" | "natal") => {
    const normalized = normalizeToAsc(p.longitude, ascDeg);
    const x = degToX(normalized, width);
    const y = row === "transit" ? 15 : height - 10;

    return (
      <g key={`${row}-${p.name}`} transform={`translate(${x},${y})`}>
        <circle r={4} className={row === "transit" ? "fill-yellow-300" : "fill-slate-200"} />
        <text
          y={-8}
          textAnchor="middle"
          className="text-[6px] fill-slate-100 tracking-[0.1em]"
        >
          {p.name[0]}{/* swap to glyph later */}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox={viewBox} className="w-full max-w-3xl">
      {/* bar background */}
      <rect
        x={0}
        y={(height - barHeight) / 2}
        width={width}
        height={barHeight}
        className="fill-[#b79a6a]"
      />

      {/* zodiac tiles */}
      {ZODIAC_SIGNS.map((sign, i) => (
        <g key={sign}>
          <rect
            x={i * signWidth}
            y={(height - barHeight) / 2}
            width={signWidth}
            height={barHeight}
            className="fill-transparent stroke-[#705330] stroke-[0.5]"
          />
          <text
            x={i * signWidth + signWidth / 2}
            y={height / 2 + 4}
            textAnchor="middle"
            className="text-[10px] fill-slate-50"
          >
            {/* replace with glyph component */}
            {sign[0]}
          </text>
        </g>
      ))}

      {/* degree ticks */}
      {Array.from({ length: 360 }).map((_, i) => {
        const x = degToX(i, width);
        const isMajor = i % 30 === 0;
        const isMid = i % 10 === 0;

        if (!isMajor && !isMid) return null;

        const tickHeight = isMajor ? 6 : 3;
        return (
          <line
            key={i}
            x1={x}
            x2={x}
            y1={(height - barHeight) / 2}
            y2={(height - barHeight) / 2 - tickHeight}
            className="stroke-slate-300 stroke-[0.5]"
          />
        );
      })}

      {/* axes (ASC / IC / DSC / MC) */}
      {Object.entries(axisXs).map(([label, x]) => (
        <g key={label}>
          <line
            x1={x}
            x2={x}
            y1={(height - barHeight) / 2}
            y2={height}
            className="stroke-slate-900 stroke-[1]"
          />
          <text
            x={x}
            y={height - 2}
            textAnchor="middle"
            className="text-[10px] fill-slate-50"
          >
            {label}
          </text>
        </g>
      ))}

      {/* season labels */}
      {seasons.map(s => {
        const midX = degToX((s.xStartDeg + s.xEndDeg) / 2, width);
        return (
          <text
            key={s.label}
            x={midX}
            y={(height - barHeight) / 2 - 14}
            textAnchor="middle"
            className="text-[9px] tracking-[0.2em] fill-slate-100"
          >
            {s.label}
          </text>
        );
      })}

      {/* planets */}
      {transitPlanets.map(p => renderPlanet(p, "transit"))}
      {natalPlanets.map(p => renderPlanet(p, "natal"))}

      {/* labels for top/bottom */}
      <text
        x={width - 4}
        y={(height - barHeight) / 2 - 2}
        textAnchor="end"
        className="text-[7px] fill-slate-100 tracking-[0.15em]"
      >
        CURRENT PLANETS AT THE TOP
      </text>
      <text
        x={width - 4}
        y={(height + barHeight) / 2 + 10}
        textAnchor="end"
        className="text-[7px] fill-slate-100 tracking-[0.15em]"
      >
        NATAL CHART AT THE BOTTOM
      </text>
    </svg>
  );
};
