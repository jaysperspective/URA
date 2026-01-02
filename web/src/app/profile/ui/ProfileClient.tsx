// src/app/profile/ui/ProfileClient.tsx
"use client";

import Link from "next/link";
import React, { useMemo } from "react";

/* ---------- helpers ---------- */

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS = [
  "Ari","Tau","Gem","Can","Leo","Vir",
  "Lib","Sco","Sag","Cap","Aqu","Pis",
] as const;

function signFromLon(lon: number) {
  return SIGNS[Math.floor(norm360(lon) / 30) % 12];
}

function fmtLon(lon: number) {
  const x = norm360(lon);
  const d = Math.floor(x % 30);
  const m = Math.floor((x % 1) * 60);
  return `${d}° ${String(m).padStart(2, "0")}'`;
}

// Seasons strictly by phase pairs
const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

// mean solar motion
const MEAN_SOLAR_RATE = 0.985647;

/* ---------- UI primitives ---------- */

function ProgressBar({
  value,
  labelLeft,
  labelRight,
}: {
  value: number;
  labelLeft: string;
  labelRight: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-[#102B53]/70">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#102B53]/15 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#50698D]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/80 backdrop-blur shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
      {children}
    </div>
  );
}

function SubCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/55 px-5 py-4">
      <div className="text-[11px] tracking-[0.18em] uppercase text-[#102B53]/60">
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="min-w-[92px]">
      <div className="text-[10px] tracking-[0.18em] uppercase text-white/70">
        {k}
      </div>
      <div className="mt-1 text-sm font-medium text-white">{v}</div>
    </div>
  );
}

/* ---------- DIAL ---------- */

function AscYearDial({ cyclePosDeg }: { cyclePosDeg: number }) {
  const size = 300;
  const r = 96;
  const cx = size / 2;
  const cy = size / 2;

  const angle = norm360(cyclePosDeg);
  const rad = ((angle - 90) * Math.PI) / 180;

  const x2 = cx + r * Math.cos(rad);
  const y2 = cy + r * Math.sin(rad);

  const majorTicks = Array.from({ length: 8 }, (_, i) => i * 45);
  const minorTicks = Array.from({ length: 16 }, (_, i) => i * 22.5);

  const tick = (deg: number, major: boolean) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const r1 = major ? r + 18 : r + 14;
    const r2 = major ? r + 30 : r + 22;
    return {
      x1: cx + r1 * Math.cos(a),
      y1: cy + r1 * Math.sin(a),
      x2: cx + r2 * Math.cos(a),
      y2: cy + r2 * Math.sin(a),
    };
  };

  const LABEL_R = r + 48;

  return (
    <div className="mx-auto relative w-[340px] h-[340px] flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-white/25 blur-[22px]" />
      <div className="relative rounded-full bg-white/70 border border-black/10 w-[330px] h-[330px]">
        <svg width={size} height={size}>
          {/* ticks */}
          {minorTicks.map((d) => (
            <line key={d} {...tick(d,false)} stroke="rgba(16,43,83,.2)" strokeWidth="2" />
          ))}
          {majorTicks.map((d) => (
            <line key={d} {...tick(d,true)} stroke="rgba(16,43,83,.3)" strokeWidth="3" />
          ))}

          {/* season labels */}
          <text x={cx} y={cy - LABEL_R} textAnchor="middle" className="fill-[#102B53]/70 text-sm">Winter</text>
          <text x={cx + LABEL_R} y={cy} dominantBaseline="middle" textAnchor="middle" className="fill-[#102B53]/70 text-sm">Fall</text>
          <text x={cx} y={cy + LABEL_R} textAnchor="middle" className="fill-[#102B53]/70 text-sm">Summer</text>
          <text x={cx - LABEL_R} y={cy} dominantBaseline="middle" textAnchor="middle" className="fill-[#102B53]/70 text-sm">Spring</text>

          {/* disc */}
          <circle cx={cx} cy={cy} r={r} fill="white" opacity="0.9" />

          {/* hand */}
          <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#102B53" strokeWidth="3" />
          <circle cx={cx} cy={cy} r="4" fill="#102B53" />
        </svg>
      </div>
    </div>
  );
}

/* ---------- MAIN ---------- */

type Props = {
  name: string;
  locationLine: string;
  timezone: string;
  asOfISO: string | null;

  natalAscLon: number | null;
  natalSunLon: number | null;
  natalMoonLon: number | null;

  movingSunLon: number | null;
  movingMoonLon: number | null;

  cyclePosDeg: number | null;
};

export default function ProfileClient(props: Props) {
  const { name, locationLine, timezone, asOfISO, natalAscLon, natalSunLon, natalMoonLon, movingSunLon, movingMoonLon, cyclePosDeg } = props;

  const derived = useMemo(() => {
    if (cyclePosDeg == null) return null;

    const cycle = norm360(cyclePosDeg);
    const phaseIndex = Math.floor(cycle / 45) + 1; // 1–8
    const phaseDeg = cycle - (phaseIndex - 1) * 45;

    const seasonIndex = Math.floor((phaseIndex - 1) / 2); // FIXED
    const season = SEASONS[seasonIndex];

    const nextPhase = phaseIndex === 8 ? 1 : phaseIndex + 1;
    let remaining = phaseIndex * 45 - cycle;
    if (remaining < 0) remaining += 360;

    const days = remaining / MEAN_SOLAR_RATE;
    const asOf = asOfISO ? new Date(asOfISO) : new Date();
    const shiftAt = new Date(asOf.getTime() + days * 86400000);

    return {
      title: `${season} · Phase ${phaseIndex}`,
      subtitle: `Degrees into phase: ${phaseDeg.toFixed(2)}° / 45°`,
      nextLabel: `${SEASONS[Math.floor((nextPhase - 1) / 2)]} · Phase ${nextPhase}`,
      shiftText: `~${days.toFixed(1)} days • ${shiftAt.toLocaleString()}`,
      phaseProgress: phaseDeg / 45,
      seasonProgress: (cycle - seasonIndex * 90) / 90,
    };
  }, [cyclePosDeg, asOfISO]);

  const display = (lon: number | null) =>
    lon != null ? `${signFromLon(lon)} ${fmtLon(lon)}` : "—";

  return (
    <div className="mt-8">
      {/* TOP STRIP */}
      <div className="mx-auto max-w-5xl flex justify-between gap-6">
        <div>
          <div className="text-white/90 text-lg font-semibold">{name}</div>
          <div className="text-white/70">{locationLine}</div>
        </div>
        <div className="flex flex-wrap gap-6">
          <Chip k="ASC (Natal)" v={display(natalAscLon)} />
          <Chip k="Sun (Natal)" v={display(natalSunLon)} />
          <Chip k="Moon (Natal)" v={display(natalMoonLon)} />
          <Chip k="Sun (Moving)" v={display(movingSunLon)} />
          <Chip k="Moon (Moving)" v={display(movingMoonLon)} />
          <Chip k="Timezone" v={timezone} />
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="mt-8 mx-auto max-w-5xl">
        <CardShell>
          <div className="px-8 py-8">
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#102B53]/55">
                Orientation
              </div>
              <div className="mt-2 text-3xl font-semibold text-[#102B53]">
                {derived?.title ?? "—"}
              </div>
              <div className="mt-2 text-sm text-[#102B53]/70">
                {derived?.subtitle ?? ""}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3">
              <SubCard title="Shift">
                <div className="text-sm font-semibold text-[#102B53]">
                  {derived?.shiftText ?? "—"}
                </div>
              </SubCard>

              <SubCard title="Next">
                <div className="text-sm font-semibold text-[#102B53]">
                  {derived?.nextLabel ?? "—"}
                </div>
              </SubCard>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/55 px-5 py-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#102B53]/60">
                  45° Phase Boundary
                </div>
                <ProgressBar value={derived?.phaseProgress ?? 0} labelLeft="0°" labelRight="45°" />
              </div>
              <div className="rounded-2xl bg-white/55 px-5 py-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#102B53]/60">
                  90° Season Arc
                </div>
                <ProgressBar value={derived?.seasonProgress ?? 0} labelLeft="0°" labelRight="90°" />
              </div>
            </div>

            <div className="mt-8">
              {cyclePosDeg != null && <AscYearDial cyclePosDeg={cyclePosDeg} />}
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <Link href="/seasons" className="px-4 py-2 rounded-2xl bg-[#102B53] text-white text-sm">
                Go to /seasons
              </Link>
              <Link href="/calendar" className="px-4 py-2 rounded-2xl border border-[#102B53]/20 text-[#102B53] text-sm">
                Go to /calendar
              </Link>
            </div>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
