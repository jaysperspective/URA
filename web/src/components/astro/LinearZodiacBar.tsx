// src/components/astro/LinearZodiacBar.tsx

"use client";

import React from "react";

export type PlanetPos = {
  name: string;
  longitude: number; // 0–360° ecliptic longitude
};

const ZODIAC_SIGNS = [
  { name: "Aries", glyph: "♈︎" },
  { name: "Taurus", glyph: "♉︎" },
  { name: "Gemini", glyph: "♊︎" },
  { name: "Cancer", glyph: "♋︎" },
  { name: "Leo", glyph: "♌︎" },
  { name: "Virgo", glyph: "♍︎" },
  { name: "Libra", glyph: "♎︎" },
  { name: "Scorpio", glyph: "♏︎" },
  { name: "Sagittarius", glyph: "♐︎" },
  { name: "Capricorn", glyph: "♑︎" },
  { name: "Aquarius", glyph: "♒︎" },
  { name: "Pisces", glyph: "♓︎" },
];

function normalizeToAsc(deg: number, ascDeg: number) {
  return (deg - ascDeg + 360) % 360;
}

function degToX(normalizedDeg: number, width: number) {
  return (normalizedDeg / 360) * width;
}

type Props = {
  ascDeg: number;
  mcDeg: number;
  natalPlanets: PlanetPos[];
  transitPlanets?: PlanetPos[];
  width?: number;
  height?: number;
};

export const LinearZodiacBar: React.FC<Props> = ({
  ascDeg,
  mcDeg,
  natalPlanets,
  transitPlanets = [],
  width = 360,
  height = 120,
}) => {
  const barHeight = 40;
  const viewBox = `0 0 ${width} ${height}`;

  const axisXs = {
    ASC: degToX(0, width),
    IC: degToX(90, width),
    DSC: degToX(180, width),
    MC: degToX(270, width),
  };

  const seasons = [
    { label: "SPRING", start: 0, end: 90 },
    { label: "SUMMER", start: 90, end: 180 },
    { label: "FALL", start: 180, end: 270 },
    { label: "WINTER", start: 270, end: 360 },
  ];

  const signWidth = width / 12;

  const renderPlanet = (p: PlanetPos, row: "transit" | "natal") => {
    const normalized = normalizeToAsc(p.longitude, ascDeg);
    const x = degToX(normalized, width);
    const y = row === "transit" ? 20 : height - 16;

    const nameLower = p.name.toLowerCase();
    const isMoon = nameLower === "moon";
    const isSun = nameLower === "sun";

    const circleFill = isSun
      ? "#facc15" // yellow sun
      : row === "transit"
      ? "#fefce8"
      : "#e5e7eb";

    return (
      <g
        key={`${row}-${p.name}`}
        transform={`translate(${x},${y})`}
        style={{ transition: "transform 0.35s ease-out" }}
      >
        <title>
          {row === "transit" ? `Transit ${p.name}` : `Natal ${p.name}`} –{" "}
          {normalized.toFixed(2)}°
        </title>

        {isMoon ? (
          <>
            {/* grey crescent moon */}
            <circle r={5} fill="#d4d4d8" />
            <circle r={5} cx={2} fill="#1B1F24" />
          </>
        ) : (
          <circle r={5} fill={circleFill} />
        )}

        <text
          y={-8}
          textAnchor="middle"
          className="text-[7px] fill-slate-100 tracking-[0.15em]"
        >
          {p.name[0]}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox={viewBox} className="w-full">
      {/* base bar */}
      <rect
        x={0}
        y={(height - barHeight) / 2}
        width={width}
        height={barHeight}
        className="fill-[#b89a6a]"
      />

      {/* zodiac tiles */}
      {ZODIAC_SIGNS.map((sign, i) => (
        <g key={sign.name}>
          <rect
            x={i * signWidth}
            y={(height - barHeight) / 2}
            width={signWidth}
            height={barHeight}
            className="fill-transparent stroke-[#6c4c28] stroke-[0.6]"
          />
          <text
            x={i * signWidth + signWidth / 2}
            y={height / 2 + 4}
            textAnchor="middle"
            className="text-[13px] fill-slate-50"
          >
            {sign.glyph}
          </text>
        </g>
      ))}

      {/* 360° ticks */}
      {Array.from({ length: 360 }).map((_, i) => {
        const isMajor = i % 30 === 0;
        const isMid = i % 10 === 0;
        if (!isMajor && !isMid) return null;

        const x = degToX(i, width);
        const tickHeight = isMajor ? 7 : 3;

        return (
          <line
            key={i}
            x1={x}
            x2={x}
            y1={(height - barHeight) / 2}
            y2={(height - barHeight) / 2 - tickHeight}
            className="stroke-slate-300 stroke-[0.6]"
          />
        );
      })}

      {/* ASC / IC / DSC / MC axes & labels */}
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
            x={label === "ASC" ? x + 4 : x}
            y={height - 4}
            textAnchor={label === "ASC" ? "start" : "middle"}
            className="text-[10px] fill-slate-50"
          >
            {label}
          </text>
        </g>
      ))}

      {/* Seasons */}
      {seasons.map((s) => {
        const midDeg = (s.start + s.end) / 2;
        const midX = degToX(midDeg, width);
        return (
          <text
            key={s.label}
            x={midX}
            y={(height - barHeight) / 2 - 14}
            textAnchor="middle"
            className="text-[9px] tracking-[0.25em] fill-slate-100"
          >
            {s.label}
          </text>
        );
      })}

      {/* planets */}
      {transitPlanets.map((p) => renderPlanet(p, "transit"))}
      {natalPlanets.map((p) => renderPlanet(p, "natal"))}
    </svg>
  );
};
