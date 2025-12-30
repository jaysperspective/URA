"use client";

import { useEffect, useMemo, useState } from "react";

type Marker = {
  kind: "New Moon" | "First Quarter" | "Full Moon" | "Last Quarter";
  whenLocal: string;
  degreeText: string;
  isoUTC: string;
};

type CalendarAPI = {
  ok: boolean;
  tz: string;
  gregorian: { ymd: string; asOfLocal: string };
  solar: { label: string };
  lunar: { phaseName: string; label: string; lunarDay: number };
  astro: {
    sunPos: string;
    moonPos: string;
    moonSign: string;
    moonEntersSign: string;
    moonEntersLocal: string;
  };
  lunation: { markers: Marker[] };
};

function iconFor(kind: Marker["kind"]) {
  if (kind === "New Moon") return "◯";
  if (kind === "First Quarter") return "◐";
  if (kind === "Full Moon") return "●";
  return "◑";
}

function MoonDisc({ phaseName }: { phaseName: string }) {
  return (
    <div className="relative mx-auto w-[220px] h-[220px] rounded-full bg-white/10 border border-white/10 shadow-inner flex items-center justify-center">
      <div className="w-[206px] h-[206px] rounded-full bg-gradient-to-b from-white/70 to-white/35 opacity-80" />
      <div className="sr-only">{phaseName}</div>
    </div>
  );
}

export default function CalendarClient() {
  const [ymd, setYmd] = useState<string | null>(null);
  const [data, setData] = useState<CalendarAPI | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(targetYmd?: string) {
    setLoading(true);
    try {
      const url = targetYmd
        ? `/api/calendar?ymd=${encodeURIComponent(targetYmd)}`
        : "/api/calendar";
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
    const [yy, mm, dd] = ymd.split("-").map(Number);
    const d = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
    d.setUTCDate(d.getUTCDate() + deltaDays);

    const next = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getUTCDate()).padStart(2, "0")}`;

    load(next).catch(() => {});
  }

  const header = useMemo(() => {
    if (!data?.ok)
      return { top: "CURRENT", mid: "—", sub: "The Moon is in —" };

    return {
      top: "CURRENT",
      mid: data.lunar.phaseName,
      sub: `The Moon is in ${data.astro.moonSign}`,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      {/* HERO like reference */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-6 py-7 text-center">
        <div className="text-white/80 text-sm tracking-widest">{header.top}</div>

        <div className="text-white text-4xl font-semibold tracking-tight mt-2">
          {header.mid}
        </div>

        <div className="mt-6 flex justify-center">
          <MoonDisc phaseName={header.mid} />
        </div>

        <div className="mt-6 text-white/85 text-xl">
          The Moon is in{" "}
          <span className="text-white font-semibold">
            {data?.astro.moonSign ?? "—"}
          </span>
        </div>

        <div className="mt-2 text-white/55 text-sm">
          As of{" "}
          <span className="text-white/70">{data?.gregorian.asOfLocal ?? "—"}</span>
        </div>

        <div className="mt-1 text-white/55 text-sm">
          Enters{" "}
          <span className="text-white/70">{data?.astro.moonEntersSign ?? "—"}</span>{" "}
          <span className="text-white/70">{data?.astro.moonEntersLocal ?? "—"}</span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="text-white/75 hover:text-white text-sm"
          >
            ◀
          </button>
          <button
            onClick={() => load()}
            className="text-white/75 hover:text-white text-sm"
          >
            ● Today
          </button>
          <button
            onClick={() => nav(1)}
            className="text-white/75 hover:text-white text-sm"
          >
            ▶
          </button>
        </div>

        {/* show your coordinate under the hero, subtle */}
        <div className="mt-5 text-white/40 text-xs">
          {loading ? "…" : data?.solar.label ?? ""}
          <span className="text-white/25"> • </span>
          {data?.lunar.label ?? ""}
        </div>
      </div>

      {/* MOON PHASE CYCLE */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4">
        <div className="text-white/60 text-xs tracking-widest text-center">
          MOON PHASE CYCLE
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {(data?.lunation.markers ?? []).map((m) => (
            <div key={m.kind} className="space-y-2">
              <div className="text-white text-2xl">{iconFor(m.kind)}</div>
              <div className="text-white/75 text-xs">{m.kind}</div>
              <div className="text-white text-sm font-semibold">{m.degreeText}</div>
              <div className="text-white/55 text-xs">{m.whenLocal}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LIST ROWS */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur divide-y divide-white/10">
        <Row left="Current Calendar" right={data?.solar.label ?? "—"} icon="⟐" />
        <Row left="Sun" right={data?.astro.sunPos ?? "—"} icon="☉" />
        <Row left="Moon" right={data?.astro.moonPos ?? "—"} icon="☾" />
        <Row left="Lunar Overlay" right={data?.lunar.label ?? "—"} icon="◑" />
      </div>
    </div>
  );
}

function Row({
  left,
  right,
  icon,
}: {
  left: string;
  right: string;
  icon: string;
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-white/80">{icon}</div>
        <div className="text-white/85 text-sm">{left}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-white/55 text-sm">{right}</div>
        <div className="text-white/25">›</div>
      </div>
    </div>
  );
}
