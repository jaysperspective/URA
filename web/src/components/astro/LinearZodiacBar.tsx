"use client";

import React from "react";

type PlanetPos = {
  name: string;
  longitude: number; // 0–360°
};

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
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
  transitPlanets?: PlanetPos[]; // optional for now
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
    { label: "FALL",   start: 180, end: 270 },
    { label: "WINTER", start: 270, end: 360 },
  ];

  const signWidth = width / 12;

  const renderPlanet = (p: PlanetPos, row: "transit" | "natal") => {
    const normalized = normalizeToAsc(p.longitude, ascDeg);
    const x = degToX(normalized, width);
    const y = row === "transit" ? 20 : height - 16;

    return (
      <g key={`${row}-${p.name}`} transform={`translate(${x},${y})`}>
        <circle
          r={5}
          className={row === "transit" ? "fill-yellow-300" : "fill-slate-200"}
        />
        <text
          y={-8}
          textAnchor="middle"
          className="text-[7px] fill-slate-100 tracking-[0.15em]"
        >
          {p.name[0]} {/* swap for glyph later */}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox={viewBox} className="w-full">
      {/* bar background */}
      <rect
        x={0}
        y={(height - barHeight) / 2}
        width={width}
        height={barHeight}
        className="fill-[#b89a6a]"
      />

      {/* zodiac tiles */}
      {ZODIAC_SIGNS.map((sign, i) => (
        <g key={sign}>
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
            className="text-[11px] fill-slate-50"
          >
            {sign[0]} {/* placeholder for sign glyph */}
          </text>
        </g>
      ))}

      {/* degree ticks (30° major, 10° minor) */}
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

      {/* cardinal axes + labels ASC / IC / DSC / MC */}
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
            y={height - 4}
            textAnchor="middle"
            className="text-[10px] fill-slate-50"
          >
            {label}
          </text>
        </g>
      ))}

      {/* seasons (Spring / Summer / Fall / Winter) */}
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

      {/* small captions like in your mock */}
      <text
        x={width - 4}
        y={(height - barHeight) / 2 - 3}
        textAnchor="end"
        className="text-[7px] fill-slate-100 tracking-[0.15em]"
      >
        CURRENT PLANETS AT THE TOP
      </text>
      <text
        x={width - 4}
        y={(height + barHeight) / 2 + 11}
        textAnchor="end"
        className="text-[7px] fill-slate-100 tracking-[0.15em]"
      >
        NATAL CHART AT THE BOTTOM
      </text>
    </svg>
  );
};
