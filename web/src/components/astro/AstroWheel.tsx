"use client";

import React from "react";

type PlanetPoint = {
  lon: number; // ecliptic longitude in degrees
};

type ChartData = {
  julianDay: number;
  planets: {
    sun?: PlanetPoint;
    moon?: PlanetPoint;
    [key: string]: PlanetPoint | undefined;
  };
  houses: number[];
  ascendant: number;
  mc: number;
};

// --- THEME: colors & radii (hybrid carved + painted) ---

const palette = {
  bg: "#141417", // deep soot
  outerRimStone: "#7A5E43",
  outerRimHighlight: "#CBB89D",
  zodiacRingLight: "#D9CFBA", // softer band
  zodiacRingDark: "#3F3A32",
  houseLine: "#C2A463",
  planetSun: "#F9D77C",
  planetMoon: "#9EE8FF",
  accentTeal: "#5EE7D5",
  accentTealSoft: "#3AA8A1",
  centerVoid: "#05060A",
  glyphFill: "#F8F1DD",
  glyphShadow: "#00000099",
};

const viewBoxSize = 400;
const center = viewBoxSize / 2;

// radii (from outer to inner)
const radii = {
  outerRimOuter: 190,
  outerRimInner: 175,
  zodiacOuter: 170,
  zodiacInner: 135,
  housesOuter: 130,
  housesInner: 85,
  planetsRadius: 145,
  centerVoid: 80,
};

// --- GEOMETRY HELPERS ---

function degreeToXY(deg: number, radius: number) {
  // 0° = top, degrees increase clockwise
  const rad = ((deg - 90) * Math.PI) / 180;
  const x = center + radius * Math.cos(rad);
  const y = center + radius * Math.sin(rad);
  return { x, y };
}

function arcPath(rOuter: number, rInner: number, startDeg: number, endDeg: number) {
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;

  const outerStart = degreeToXY(startDeg, rOuter);
  const outerEnd = degreeToXY(endDeg, rOuter);
  const innerEnd = degreeToXY(endDeg, rInner);
  const innerStart = degreeToXY(startDeg, rInner);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

// standard order
const zodiacGlyphs = [
  "♈︎", // Aries
  "♉︎", // Taurus
  "♊︎", // Gemini
  "♋︎", // Cancer
  "♌︎", // Leo
  "♍︎", // Virgo
  "♎︎", // Libra
  "♏︎", // Scorpio
  "♐︎", // Sagittarius
  "♑︎", // Capricorn
  "♒︎", // Aquarius
  "♓︎", // Pisces
];

// --- COMPONENT ---

type Props = {
  chart: ChartData;
};

export const AstroWheel: React.FC<Props> = ({ chart }) => {
  const { planets, houses, ascendant, mc } = chart;

  const sun = planets.sun;
  const moon = planets.moon;

  // derived angles for full cross
  const ascDeg = ascendant;
  const mcDeg = mc;
  const dscDeg = (ascendant + 180) % 360;
  const icDeg = (mc + 180) % 360;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        aspectRatio: "1 / 1",
        background: palette.bg,
        borderRadius: 24,
        padding: 16,
        boxShadow: "0 18px 45px rgba(0,0,0,0.6)",
      }}
    >
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        width="100%"
        height="100%"
      >
        <defs>
          {/* subtle vignette */}
          <radialGradient id="wheel-vignette" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF11" />
            <stop offset="50%" stopColor="#FFFFFF00" />
            <stop offset="100%" stopColor="#000000FF" />
          </radialGradient>

          {/* stone rim gradient */}
          <linearGradient id="rim-stone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.outerRimHighlight} />
            <stop offset="40%" stopColor={palette.outerRimStone} />
            <stop offset="100%" stopColor="#3C2C1E" />
          </linearGradient>

          {/* zodiac wash gradient */}
          <linearGradient id="zodiac-wash" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.zodiacRingDark} />
            <stop offset="50%" stopColor={palette.zodiacRingLight} />
            <stop offset="100%" stopColor={palette.zodiacRingDark} />
          </linearGradient>

          {/* Uranus teal accent ring */}
          <radialGradient id="uranus-accent" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={`${palette.accentTeal}55`} />
            <stop offset="40%" stopColor={`${palette.accentTealSoft}11`} />
            <stop offset="100%" stopColor="#00000000" />
          </radialGradient>

          {/* iris gradient for the eye */}
          <radialGradient id="eye-iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#020711" />
            <stop offset="40%" stopColor="#102334" />
            <stop offset="75%" stopColor="#1b4d54" />
            <stop offset="100%" stopColor="#02060b" />
          </radialGradient>
        </defs>

        {/* BACKDROP */}
        <rect
          x={0}
          y={0}
          width={viewBoxSize}
          height={viewBoxSize}
          fill={palette.bg}
        />

        {/* Outer vignette */}
        <circle
          cx={center}
          cy={center}
          r={radii.outerRimOuter}
          fill="url(#wheel-vignette)"
        />

        {/* OUTER RIM (carved stone) */}
        <circle
          cx={center}
          cy={center}
          r={radii.outerRimOuter}
          fill="none"
          stroke="url(#rim-stone)"
          strokeWidth={radii.outerRimOuter - radii.outerRimInner}
          strokeLinecap="round"
        />

        {/* 360° degree ticks on the rim */}
        {Array.from({ length: 360 }).map((_, i) => {
          const deg = i;
          const isTen = i % 10 === 0;
          const innerRadius = radii.outerRimInner - (isTen ? 12 : 6);
          const outerRadius = radii.outerRimInner + (isTen ? 4 : 1.5);
          const start = degreeToXY(deg, innerRadius);
          const end = degreeToXY(deg, outerRadius);

          return (
            <line
              key={`deg-tick-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isTen ? palette.outerRimHighlight : "#CBB89D33"}
              strokeWidth={isTen ? 1.4 : 0.6}
              strokeLinecap="round"
            />
          );
        })}

        {/* URANUS ACCENT HAZE (unexpected ether ring) */}
        <circle
          cx={center}
          cy={center}
          r={(radii.zodiacOuter + radii.zodiacInner) / 2}
          fill="url(#uranus-accent)"
        />

        {/* ZODIAC RING – glyph order inverted so signs read counter-clockwise */}
        {Array.from({ length: 12 }).map((_, i) => {
          const startDeg = i * 30;
          const endDeg = (i + 1) * 30;
          const path = arcPath(
            radii.zodiacOuter,
            radii.zodiacInner,
            startDeg,
            endDeg
          );
          const isCardinal = i % 3 === 0;

          // map clockwise wedge index -> CCW sign order
          const glyphIndex = (12 - i) % 12;
          const glyph = zodiacGlyphs[glyphIndex];

          const midDeg = startDeg + 15;
          const labelPos = degreeToXY(
            midDeg,
            (radii.zodiacOuter + radii.zodiacInner) / 2 + 4
          );

          return (
            <g key={`zodiac-${i}`}>
              <path
                d={path}
                fill="url(#zodiac-wash)"
                opacity={0.9}
                stroke={isCardinal ? palette.outerRimHighlight : "#00000066"}
                strokeWidth={isCardinal ? 1.4 : 0.6}
              />

              {/* shadow / engraved glow behind glyph */}
              <text
                x={labelPos.x + 1}
                y={labelPos.y + 1}
                fill={palette.glyphShadow}
                fontSize={18}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily:
                    '"Times New Roman", "Georgia", "Segoe UI Symbol", system-ui, sans-serif',
                }}
                opacity={0.9}
              >
                {glyph}
              </text>

              {/* main glyph */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill={palette.glyphFill}
                fontSize={18}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontFamily:
                    '"Times New Roman", "Georgia", "Segoe UI Symbol", system-ui, sans-serif',
                }}
              >
                {glyph}
              </text>
            </g>
          );
        })}

        {/* HOUSES – carved inner spokes */}
        {houses.map((deg, idx) => {
          const start = degreeToXY(deg, radii.housesInner);
          const end = degreeToXY(deg, radii.housesOuter);
          const isAngular = idx === 0 || idx === 3 || idx === 6 || idx === 9;
          return (
            <line
              key={`house-${idx}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={palette.houseLine}
              strokeWidth={isAngular ? 1.6 : 0.9}
              strokeLinecap="round"
              opacity={isAngular ? 0.95 : 0.6}
            />
          );
        })}

        {/* FULL ANGULAR CROSS: ASC / DSC / MC / IC lines + markers */}
        {(() => {
          const makeLine = (deg: number, color: string, width: number) => {
            const inner = degreeToXY(deg, radii.centerVoid);
            const outer = degreeToXY(deg, radii.outerRimOuter);
            return (
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
                opacity={0.95}
              />
            );
          };

          const ascOuter = degreeToXY(ascDeg, radii.outerRimOuter);
          const dscOuter = degreeToXY(dscDeg, radii.outerRimOuter);
          const mcOuter = degreeToXY(mcDeg, radii.outerRimOuter);
          const icOuter = degreeToXY(icDeg, radii.outerRimOuter);

          return (
            <>
              {/* lines */}
              {makeLine(ascDeg, palette.accentTeal, 1.8)}
              {makeLine(dscDeg, palette.accentTeal, 1.4)}
              {makeLine(mcDeg, palette.outerRimHighlight, 1.8)}
              {makeLine(icDeg, palette.outerRimHighlight, 1.4)}

              {/* rim markers + labels */}
              <circle
                cx={ascOuter.x}
                cy={ascOuter.y}
                r={6}
                fill={palette.accentTeal}
                stroke={palette.outerRimHighlight}
                strokeWidth={1.5}
              />
              <text
                x={ascOuter.x}
                y={ascOuter.y - 10}
                fill={palette.accentTeal}
                fontSize={10}
                textAnchor="middle"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                ASC
              </text>

              <circle
                cx={dscOuter.x}
                cy={dscOuter.y}
                r={5}
                fill={palette.accentTeal}
                stroke={palette.accentTealSoft}
                strokeWidth={1.2}
              />
              <text
                x={dscOuter.x}
                y={dscOuter.y - 10}
                fill={palette.accentTeal}
                fontSize={10}
                textAnchor="middle"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                DSC
              </text>

              <circle
                cx={mcOuter.x}
                cy={mcOuter.y}
                r={5.5}
                fill={palette.outerRimHighlight}
                stroke={palette.accentTealSoft}
                strokeWidth={1.3}
              />
              <text
                x={mcOuter.x}
                y={mcOuter.y - 10}
                fill={palette.outerRimHighlight}
                fontSize={10}
                textAnchor="middle"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                MC
              </text>

              <circle
                cx={icOuter.x}
                cy={icOuter.y}
                r={5}
                fill={palette.outerRimHighlight}
                stroke={palette.houseLine}
                strokeWidth={1.2}
              />
              <text
                x={icOuter.x}
                y={icOuter.y - 10}
                fill={palette.outerRimHighlight}
                fontSize={10}
                textAnchor="middle"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                IC
              </text>
            </>
          );
        })()}

        {/* PLANETS – SUN & MOON as luminous carved gems */}
        {sun && (
          (() => {
            const p = degreeToXY(sun.lon, radii.planetsRadius);
            return (
              <g>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={10}
                  fill={palette.planetSun}
                  stroke="#B8893B"
                  strokeWidth={2}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16}
                  fill="none"
                  stroke={`${palette.planetSun}55`}
                  strokeWidth={1}
                />
              </g>
            );
          })()
        )}

        {moon && (
          (() => {
            const p = degreeToXY(moon.lon, radii.planetsRadius - 18);
            return (
              <g>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={8}
                  fill={palette.planetMoon}
                  stroke={palette.accentTealSoft}
                  strokeWidth={1.6}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={14}
                  fill="none"
                  stroke={`${palette.planetMoon}44`}
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
              </g>
            );
          })()
        )}

        {/* CENTER "EYE" – cosmic iris + pupil with stars */}

        {/* iris */}
        <circle
          cx={center}
          cy={center}
          r={radii.centerVoid}
          fill="url(#eye-iris)"
          stroke="#18222C"
          strokeWidth={2}
        />

        {/* subtle inner ring to feel carved */}
        <circle
          cx={center}
          cy={center}
          r={radii.centerVoid * 0.72}
          fill="none"
          stroke="#263746"
          strokeWidth={1.2}
          strokeDasharray="3 6"
          opacity={0.7}
        />

        {/* pupil */}
        <circle
          cx={center}
          cy={center}
          r={radii.centerVoid * 0.45}
          fill={palette.centerVoid}
        />

        {/* star specks inside the pupil */}
        {[
          { dx: -10, dy: -6, r: 1.4 },
          { dx: 6, dy: -3, r: 1.1 },
          { dx: -4, dy: 7, r: 1.2 },
          { dx: 11, dy: 5, r: 1.5 },
        ].map((s, idx) => (
          <circle
            key={`star-${idx}`}
            cx={center + s.dx}
            cy={center + s.dy}
            r={s.r}
            fill="#9EE8FF"
          />
        ))}
      </svg>
    </div>
  );
};
