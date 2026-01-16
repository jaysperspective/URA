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

/**
 * REALISTIC TILE MOON
 * - No <defs>, no ids, no clipPaths → nothing can collide/hydration-mismatch.
 * - Uses layered circles + blur to create a soft terminator and "sphere" feel.
 */
function RealMoonTile({
  phaseAngleDeg,
  size = 42,
}: {
  phaseAngleDeg: number;
  size?: number;
}) {
  const a = normalize360(phaseAngleDeg);
  const rad = (a * Math.PI) / 180;

  // illumination proxy: new≈0, full≈1
  const illum01 = (1 - Math.cos(rad)) / 2;

  // waxing: light on right; waning: light on left
  const waxing = a < 180;

  // terminator offset: -1..+1
  // using cos produces a nice progression of the shadow edge
  const t = Math.cos(rad);
  const r = size / 2;

  // how far the shadow circle should be shifted
  // closer to ±r near quarters, closer to 0 near full/new
  const dx = (waxing ? -1 : 1) * r * (1 - Math.abs(t)) * 0.95;

  // stronger shadow near new moon, lighter shadow near full moon
  const shadowOpacity = 0.85 - illum01 * 0.55; // ~0.85 at new, ~0.30 at full

  return (
    <div
      className="relative"
      style={{ width: size, height: size, borderRadius: 9999 }}
      aria-hidden="true"
    >
      {/* base sphere */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.96) 0%, rgba(244,238,230,0.92) 48%, rgba(214,206,196,0.84) 100%)",
          boxShadow:
            "inset -6px -10px 18px rgba(0,0,0,0.22), inset 6px 8px 14px rgba(255,255,255,0.16)",
        }}
      />

      {/* subtle texture specks */}
      <div className="absolute inset-0 rounded-full opacity-[0.22]">
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.16,
            height: size * 0.16,
            left: size * 0.30,
            top: size * 0.30,
            background: "rgba(60,62,70,0.65)",
            filter: "blur(0.2px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.10,
            height: size * 0.10,
            left: size * 0.58,
            top: size * 0.24,
            background: "rgba(60,62,70,0.55)",
            filter: "blur(0.2px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.18,
            height: size * 0.18,
            left: size * 0.48,
            top: size * 0.58,
            background: "rgba(60,62,70,0.50)",
            filter: "blur(0.2px)",
          }}
        />
      </div>

      {/* shadow wash */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "rgba(10,14,24,0.10)",
        }}
      />

      {/* terminator shadow: big blurred circle shifted left/right */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          transform: `translateX(${dx}px)`,
          background:
            "radial-gradient(circle at 55% 50%, rgba(10,14,24,0.35) 0%, rgba(10,14,24,0.92) 70%)",
          opacity: shadowOpacity,
          filter: "blur(1.2px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* soft limb darkening */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35), inset 0 0 18px rgba(0,0,0,0.25)",
          pointerEvents: "none",
        }}
      />
    </div>
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
  const [open, setOpen] = useState(false);

  // Initialize to current date, will be reset when modal opens
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);

  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tzOffsetMin = useMemo(() => -new Date().getTimezoneOffset(), []);

  // Track if we need to reset to current month on open
  const [needsReset, setNeedsReset] = useState(true);

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

  // When modal opens, reset to current month first
  useEffect(() => {
    if (open && needsReset) {
      const now = new Date();
      setYear(now.getFullYear());
      setMonth(now.getMonth() + 1);
      setNeedsReset(false);
    }
  }, [open, needsReset]);

  // Load data when year/month changes while open
  useEffect(() => {
    if (open && !needsReset) {
      loadMonth(year, month);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, year, month, needsReset]);

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

  function handleClose() {
    setOpen(false);
    setNeedsReset(true); // Reset flag so next open starts at current month
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border p-2 hover:shadow-sm"
        style={{
          borderColor: "rgba(248,244,238,0.14)",
          background: "rgba(248,244,238,0.10)",
          color: "rgba(248,244,238,0.80)",
        }}
        aria-label="Open moon calendar"
        title="Moon calendar"
      >
        <CalendarIcon />
      </button>

      <Modal open={open} onClose={handleClose} title={monthLabel(year, month)}>
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
                    <RealMoonTile phaseAngleDeg={r?.phaseAngleDeg ?? 0} size={42} />
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
