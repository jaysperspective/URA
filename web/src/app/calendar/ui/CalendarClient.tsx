"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarAPI = {
  ok: boolean;
  tz: string;
  gregorian: { ymd: string };
  solar: {
    year: number;
    kind: "PHASE" | "INTERPHASE";
    phase?: number;
    dayInPhase?: number;
    interphaseDay?: number;
    interphaseTotal?: number;
    label: string; // e.g. Y12-P3-22 or Y12-INTER-3
    dayIndexInYear: number; // 0..(364/365)
    yearLength: number; // 365 or 366
  };
  lunar: {
    synodicMonthDays: number;
    phaseAngleDeg: number; // 0..360
    lunarAgeDays: number; // 0..29.53
    lunarDay: number; // 0..29 (integer)
    phaseName: string; // New, Waxing Crescent, ...
    cycleNumber: number; // LC-###
    label: string; // LC-843 • LD-14 (Full)
  };
  anchors: {
    equinoxLocalDay: string; // E(Y) local day
    nextEquinoxLocalDay: string; // E(Y+1)
  };
};

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4">
      <div className="text-white/70 text-xs tracking-wide uppercase mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

export default function CalendarClient() {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<CalendarAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [openGreg, setOpenGreg] = useState(false);

  const titleLines = useMemo(() => {
    if (!data?.ok) return { top: "—", bottom: "—" };
    return {
      top: data.solar.label,
      bottom: data.lunar.label,
    };
  }, [data]);

  async function load(targetYmd?: string) {
    setLoading(true);
    try {
      const url = targetYmd ? `/api/calendar?ymd=${encodeURIComponent(targetYmd)}` : "/api/calendar";
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as CalendarAPI;
      setData(json);
      setYmd(json.gregorian.ymd);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function nav(deltaDays: number) {
    if (!ymd) return;
    // ask server for next/prev; the server handles TZ + civil days
    const parts = ymd.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    d.setUTCDate(d.getUTCDate() + deltaDays);

    const next = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate()
    ).padStart(2, "0")}`;

    load(next).catch(() => {});
  }

  return (
    <div className="space-y-4">
      {/* HERO */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-6 py-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-white text-4xl font-semibold tracking-tight">
              {titleLines.top}
            </div>
            <div className="text-white/80 text-lg mt-2">
              {titleLines.bottom}
            </div>
            <div className="text-white/45 text-xs mt-3">
              America/New_York • Midnight-based civil days
            </div>
          </div>

          <div className="text-right">
            <div className="text-white/60 text-xs">Status</div>
            <div className="text-white text-sm mt-1">
              {loading ? "Computing…" : "Live"}
            </div>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="text-white/80 hover:text-white text-sm"
        >
          ◀ Previous
        </button>

        <button
          onClick={() => load()}
          className="text-white/80 hover:text-white text-sm"
        >
          ● Today
        </button>

        <button
          onClick={() => nav(1)}
          className="text-white/80 hover:text-white text-sm"
        >
          Next ▶
        </button>
      </div>

      {/* CONTEXT PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Solar Context">
          {!data ? (
            <div className="text-white/60 text-sm">—</div>
          ) : (
            <div className="space-y-2">
              <div className="text-white text-sm">
                {data.solar.kind === "PHASE" ? (
                  <>
                    Phase <span className="text-white font-semibold">{data.solar.phase}</span> of 8
                    <span className="text-white/40"> • </span>
                    Day <span className="text-white font-semibold">{data.solar.dayInPhase}</span> of 45
                  </>
                ) : (
                  <>
                    Interphase
                    <span className="text-white/40"> • </span>
                    Day <span className="text-white font-semibold">{data.solar.interphaseDay}</span> of{" "}
                    <span className="text-white font-semibold">{data.solar.interphaseTotal}</span>
                  </>
                )}
              </div>

              <div className="text-white/55 text-xs">
                Day index: {data.solar.dayIndexInYear} / {data.solar.yearLength - 1}
              </div>

              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white/35"
                  style={{
                    width: `${Math.round(
                      ((data.solar.dayIndexInYear + 1) / data.solar.yearLength) * 100
                    )}%`,
                  }}
                />
              </div>

              <div className="text-white/40 text-xs">
                Anchor: {data.anchors.equinoxLocalDay} → Next: {data.anchors.nextEquinoxLocalDay}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Lunar Context">
          {!data ? (
            <div className="text-white/60 text-sm">—</div>
          ) : (
            <div className="space-y-2">
              <div className="text-white text-sm">
                Lunar Cycle: <span className="font-semibold">{data.lunar.cycleNumber}</span>
              </div>
              <div className="text-white text-sm">
                Lunar Day: <span className="font-semibold">{data.lunar.lunarDay}</span>
                <span className="text-white/40"> • </span>
                Phase: <span className="font-semibold">{data.lunar.phaseName}</span>
              </div>

              <div className="text-white/55 text-xs">
                Age: {data.lunar.lunarAgeDays.toFixed(2)} days • Angle: {data.lunar.phaseAngleDeg.toFixed(2)}°
              </div>

              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white/35"
                  style={{
                    width: `${Math.round((data.lunar.lunarAgeDays / data.lunar.synodicMonthDays) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* GREGORIAN BRIDGE */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4">
        <button
          className="w-full flex items-center justify-between text-white/80 hover:text-white"
          onClick={() => setOpenGreg((v) => !v)}
        >
          <span className="text-sm">Gregorian</span>
          <span className="text-sm">{openGreg ? "▾" : "▸"}</span>
        </button>

        {openGreg && data && (
          <div className="mt-3 text-white/70 text-sm space-y-1">
            <div>{data.gregorian.ymd}</div>
            <div className="text-white/40 text-xs">
              (Bridge only — Solar coordinate is primary)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
