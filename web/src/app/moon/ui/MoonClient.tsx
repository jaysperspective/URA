"use client";

import React, { useEffect, useMemo, useState } from "react";

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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3v3M16 3v3" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
      <path d="M8 16h.01M12 16h.01M16 16h.01" />
    </svg>
  );
}

/* ============================================================
   REALISTIC MOON DISK (no useId)
============================================================ */
function MoonDisk({
  phaseAngleDeg,
  size = 44,
}: {
  phaseAngleDeg: number;
  size?: number;
}) {
  // Stable unique id per component instance (client-only)
  const uid = useMemo(() => `moon-${Math.random().toString(36).slice(2, 10)}`, []);

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
    <svg width={size} height={size} viewBox="0 0 48 48" className="block" aria-hidden="true">
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
          <circle cx={terminatorX} cy={cy} r={r} fill={`url(#shadow-${uid})`} />
        </g>
      </g>

      {/* Rim */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.35)" />
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-white/90 font-semibold tracking-tight">{title}</div>
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

  const tzOffsetMin = useMemo(() => -now.getTimezoneOffset(), [now]);

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

      const res = await fetch(`/api/moon-calendar?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load moon calendar");
      setRows(json.rows as DayRow[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadMonth(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, year, month]);

  function prevMonth() {
    let y = year;
    let m = month - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setYear(y);
    setMonth(m);
  }

  function nextMonth() {
    let y = year;
    let m = month + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
  }

  const grid = useMemo(() => {
    const dim = daysInMonthUTC(year, month);
    const firstDow = firstWeekdayIndexSun0(year, month);

    const byDay = new Map<number, DayRow>();
    rows.forEach((r) => byDay.set(r.day, r));

    const cells: Array<{ kind: "blank" } | { kind: "day"; day: number; row?: DayRow }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ kind: "blank" });
    for (let d = 1; d <= dim; d++) cells.push({ kind: "day", day: d, row: byDay.get(d) });
    while (cells.length % 7 !== 0) cells.push({ kind: "blank" });

    return cells;
  }, [rows, year, month]);

  return (
    <>
      {/* icon-only */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border p-2 hover:shadow-sm"
        style={{
          borderColor: "rgba(18,22,32,0.20)",
          background: "rgba(255,255,255,0.55)",
          color: "rgba(18,22,32,0.70)",
        }}
        aria-label="Open moon calendar"
        title="Moon calendar"
      >
        <CalendarIcon />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={monthLabel(year, month)}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="rounded-lg px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
          >
            ←
          </button>

          <div className="text-white/60 text-xs tracking-[0.22em] uppercase">
            {year}-{pad2(month)}
          </div>

          <button
            onClick={nextMonth}
            className="rounded-lg px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-xs text-white/60 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-1">
              {d}
            </div>
          ))}
        </div>

        {loading && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">
            Loading month…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-7 gap-2">
            {grid.map((cell, idx) => {
              if (cell.kind === "blank") return <div key={idx} className="h-[92px]" />;

              const r = cell.row;

              return (
                <div
                  key={idx}
                  className="h-[92px] rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-2 flex flex-col items-center justify-between"
                >
                  <div className="w-full flex items-center justify-between">
                    <div className="text-white/70 text-[11px]">{cell.day}</div>
                    <div className="text-white/55 text-[11px]">{r?.moonSignGlyph ?? ""}</div>
                  </div>

                  <div className="mt-1">
                    <MoonDisk phaseAngleDeg={r?.phaseAngleDeg ?? 0} size={42} />
                  </div>

                  <div className="text-white/80 text-[12px] font-medium">
                    {r ? `${r.illuminationPct}%` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 text-white/45 text-xs">
          Daily values are sampled at local noon for stability.
        </div>
      </Modal>
    </>
  );
}
