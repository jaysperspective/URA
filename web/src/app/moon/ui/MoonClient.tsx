"use client";

import React, { useEffect, useMemo, useState, useId } from "react";

type DayRow = {
  dateISO: string;
  day: number;
  illuminationPct: number;
  phaseAngleDeg: number;
  moonLon: number;
  moonSign: string;
  moonSignGlyph: string;
};

function normalize360(deg: number) {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthLabel(year: number, month1to12: number) {
  const dt = new Date(Date.UTC(year, month1to12 - 1, 1));
  return dt.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function firstWeekdayIndexSun0(year: number, month1to12: number) {
  const dt = new Date(Date.UTC(year, month1to12 - 1, 1));
  return dt.getUTCDay();
}

function daysInMonthUTC(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/* ============================================================
   REALISTIC MOON DISK
============================================================ */
function MoonDisk({
  phaseAngleDeg,
  size = 44,
}: {
  phaseAngleDeg: number;
  size?: number;
}) {
  const uid = useId();

  const a = normalize360(phaseAngleDeg);
  const rad = (a * Math.PI) / 180;

  // new = -1, full = +1
  const k = -Math.cos(rad);

  const r = 20;
  const cx = 24;
  const cy = 24;

  const shift = k * r;
  const waxing = a < 180;
  const terminatorX = waxing ? cx - shift : cx + shift;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="block"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`base-${uid}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f2eee6" />
          <stop offset="100%" stopColor="#d6cec4" />
        </radialGradient>

        <radialGradient id={`shadow-${uid}`} cx="60%" cy="50%" r="80%">
          <stop offset="0%" stopColor="rgba(10,14,24,0.25)" />
          <stop offset="100%" stopColor="rgba(10,14,24,0.95)" />
        </radialGradient>

        <filter id={`blur-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>

        <clipPath id={`clip-${uid}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      {/* Base sphere */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#base-${uid})`} />

      {/* Texture */}
      <g clipPath={`url(#clip-${uid})`} opacity={0.9}>
        <g opacity="0.2">
          <circle cx="18" cy="18" r="2.2" fill="rgba(60,62,70,0.6)" />
          <circle cx="30" cy="16" r="1.6" fill="rgba(60,62,70,0.5)" />
          <circle cx="24" cy="28" r="2.4" fill="rgba(60,62,70,0.45)" />
          <circle cx="15" cy="29" r="1.5" fill="rgba(60,62,70,0.45)" />
          <circle cx="32" cy="31" r="1.8" fill="rgba(60,62,70,0.4)" />
        </g>

        {/* Limb darkening */}
        <circle cx={cx} cy={cy} r={r} fill="rgba(0,0,0,0.10)" />
      </g>

      {/* Shadow + terminator */}
      <g clipPath={`url(#clip-${uid})`}>
        <g filter={`url(#blur-${uid})`}>
          <circle
            cx={terminatorX}
            cy={cy}
            r={r}
            fill={`url(#shadow-${uid})`}
          />
        </g>
      </g>

      {/* Rim */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(0,0,0,0.35)"
      />
    </svg>
  );
}

/* ============================================================
   MODAL
============================================================ */
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-white font-semibold">{title}</div>
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
            >
              Close
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN CONTROL
============================================================ */
export default function MoonCalendarControl() {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tzOffsetMin = -now.getTimezoneOffset();

  async function loadMonth(y: number, m: number) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        year: String(y),
        month: String(m),
        tzOffsetMin: String(tzOffsetMin),
        lat: "0",
        lon: "0",
      });
      const res = await fetch(`/api/moon-calendar?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error);
      setRows(json.rows);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadMonth(year, month);
  }, [open, year, month]);

  const grid = useMemo(() => {
    const dim = daysInMonthUTC(year, month);
    const firstDow = firstWeekdayIndexSun0(year, month);
    const byDay = new Map(rows.map((r) => [r.day, r]));

    const cells: any[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(byDay.get(d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [rows, year, month]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border p-2"
        style={{
          borderColor: "rgba(18,22,32,0.2)",
          background: "rgba(255,255,255,0.55)",
          color: "rgba(18,22,32,0.7)",
        }}
        aria-label="Open moon calendar"
      >
        📅
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={monthLabel(year, month)}>
        {loading && <div className="text-white/60">Loading…</div>}
        {error && <div className="text-red-300">{error}</div>}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-7 gap-2 text-xs text-white/60 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {grid.map((r, i) =>
                r ? (
                  <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-center"
                  >
                    <div className="text-white/70 text-[11px] mb-1">{r.day}</div>
                    <MoonDisk phaseAngleDeg={r.phaseAngleDeg} size={40} />
                    <div className="text-white/70 text-[11px] mt-1">
                      {r.illuminationPct}%
                    </div>
                  </div>
                ) : (
                  <div key={i} />
                )
              )}
            </div>

            <div className="mt-3 text-xs text-white/40">
              Daily values sampled at local noon.
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
