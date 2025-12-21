"use client";

import React, { useEffect, useMemo, useState } from "react";

type GeoResult =
  | {
      ok: true;
      lat: number;
      lon: number;
      display_name?: string;
      cached?: boolean;
    }
  | { ok: false; error: string };

export type AstroPayloadText = string;

export type AstroInputFormProps = {
  title?: string;
  initial?: {
    birthDate?: string; // YYYY-MM-DD
    birthTime?: string; // HH:MM
    timeZone?: string; // IANA tz
    birthCityState?: string;
    asOfDate?: string;
    lat?: number;
    lon?: number;
    resolvedLabel?: string;
  };
  onGenerate: (payloadText: AstroPayloadText) => Promise<void> | void;

  // optional behavior flags
  randomizeBirthDate?: boolean; // random default birthDate (only if initial.birthDate not provided)
  lockAsOfToToday?: boolean; // as_of_date always = today (local), and input is disabled
  defaultAsOfToToday?: boolean; // as_of_date defaults to today ONCE (editable). Ignored if initial.asOfDate provided.
};

const TIMEZONES = [
  { label: "Eastern (America/New_York)", value: "America/New_York" },
  { label: "Central (America/Chicago)", value: "America/Chicago" },
  { label: "Mountain (America/Denver)", value: "America/Denver" },
  { label: "Pacific (America/Los_Angeles)", value: "America/Los_Angeles" },
  { label: "UTC", value: "UTC" },
] as const;

// Short UI labels (keeps IANA internally for DST-safe math)
const TZ_ABBREVIATIONS: Record<string, string> = {
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Los_Angeles": "PT",
  UTC: "UTC",
};

function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function randomISODateBetween(start: Date, end: Date) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const t = startMs + Math.floor(Math.random() * Math.max(1, endMs - startMs));
  return localISODate(new Date(t));
}

// Demo range: 1950 → 2010 (adjust anytime)
function defaultRandomBirthDate() {
  return randomISODateBetween(
    new Date("1950-01-01T00:00:00"),
    new Date("2010-12-31T00:00:00")
  );
}

// ---- Timezone offset helpers (DST-safe, no libs) ----
function offsetMinutesAtInstant(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;

  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  const hh = Number(get("hour"));
  const mm = Number(get("minute"));
  const ss = Number(get("second"));

  const asUTC = Date.UTC(y, m - 1, d, hh, mm, ss);
  return Math.round((asUTC - date.getTime()) / 60000);
}

function computeOffsetForLocalWallTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): number {
  let guessUTC = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 4; i++) {
    const off = offsetMinutesAtInstant(new Date(guessUTC), timeZone);
    const nextGuess =
      Date.UTC(year, month - 1, day, hour, minute, 0) - off * 60_000;
    if (Math.abs(nextGuess - guessUTC) < 1_000) {
      guessUTC = nextGuess;
      break;
    }
    guessUTC = nextGuess;
  }

  return offsetMinutesAtInstant(new Date(guessUTC), timeZone);
}

function offsetMinutesToString(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

function fmtBirthDatetime(birthDate: string, birthTime: string) {
  return `${birthDate} ${birthTime}`;
}

function isValidLatLon(lat: number | null, lon: number | null) {
  if (lat == null || lon == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (Math.abs(lat) > 90) return false;
  if (Math.abs(lon) > 180) return false;
  return true;
}

export default function AstroInputForm({
  title = "URA • Input",
  initial,
  onGenerate,
  randomizeBirthDate = false,
  lockAsOfToToday = false,
  defaultAsOfToToday = false,
}: AstroInputFormProps) {
  const [birthDate, setBirthDate] = useState(() => {
    if (initial?.birthDate) return initial.birthDate;
    if (randomizeBirthDate) return defaultRandomBirthDate();
    return "1990-01-24";
  });

  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "01:39");
  const [timeZone, setTimeZone] = useState<string>(
    initial?.timeZone ?? "America/New_York"
  );

  const [birthCityState, setBirthCityState] = useState(
    initial?.birthCityState ?? "Danville, VA"
  );

  const [resolvedLat, setResolvedLat] = useState<number | null>(
    typeof initial?.lat === "number" ? initial.lat : 36.585
  );
  const [resolvedLon, setResolvedLon] = useState<number | null>(
    typeof initial?.lon === "number" ? initial.lon : -79.395
  );

  const [resolvedLabel, setResolvedLabel] = useState<string>(
    initial?.resolvedLabel ?? ""
  );

  const [asOfDate, setAsOfDate] = useState(() => {
    if (lockAsOfToToday) return localISODate();
    if (!initial?.asOfDate && defaultAsOfToToday) return localISODate();
    return initial?.asOfDate ?? "2025-12-19";
  });

  // If locked to today, keep it current (and update if midnight passes)
  useEffect(() => {
    if (!lockAsOfToToday) return;

    const sync = () => {
      const today = localISODate();
      setAsOfDate((prev) => (prev === today ? prev : today));
    };

    sync();
    const id = setInterval(sync, 60_000);
    return () => clearInterval(id);
  }, [lockAsOfToToday]);

  const [loading, setLoading] = useState(false);
  const [statusLine, setStatusLine] = useState<string>("");
  const [locationNudge, setLocationNudge] = useState<string>("");

  const hasResolvedLocation = isValidLatLon(resolvedLat, resolvedLon);

  const debugPayload = useMemo(() => {
    if (!hasResolvedLocation) return "";

    const y = Number(birthDate.slice(0, 4));
    const m = Number(birthDate.slice(5, 7));
    const d = Number(birthDate.slice(8, 10));
    const hh = Number(birthTime.slice(0, 2));
    const mm = Number(birthTime.slice(3, 5));

    const offMin = computeOffsetForLocalWallTime(y, m, d, hh, mm, timeZone);
    const tz_offset = offsetMinutesToString(offMin);

    return [
      `birth_datetime: ${fmtBirthDatetime(birthDate, birthTime)}`,
      `as_of_date: ${asOfDate}`,
      `tz_offset: ${tz_offset}`,
      `lat: ${resolvedLat}`,
      `lon: ${resolvedLon}`,
    ].join("\n");
  }, [
    birthDate,
    birthTime,
    timeZone,
    asOfDate,
    resolvedLat,
    resolvedLon,
    hasResolvedLocation,
  ]);

  async function geocodeCityState(): Promise<GeoResult> {
    const q = birthCityState.trim();
    if (!q) return { ok: false, error: "Enter a City, State first." };

    setStatusLine("Resolving location…");

    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ q }),
    });

    const data = (await res.json().catch(() => null)) as GeoResult | null;
    if (!data) return { ok: false, error: "Geocode returned invalid response." };

    if (!res.ok || (data as any).ok === false) {
      return { ok: false, error: (data as any).error ?? `HTTP ${res.status}` };
    }
    return data as any;
  }

  async function resolveLocation(): Promise<boolean> {
    setLocationNudge("");

    setResolvedLat(null);
    setResolvedLon(null);
    setResolvedLabel("");

    const geo = await geocodeCityState();
    if (!geo.ok) {
      setStatusLine(`Location error: ${geo.error}`);
      setLocationNudge(geo.error);
      return false;
    }

    setResolvedLat(geo.lat);
    setResolvedLon(geo.lon);
    setResolvedLabel(geo.display_name ?? "");

    setStatusLine(geo.cached ? "Location resolved (cached)." : "Location resolved.");
    setTimeout(() => setStatusLine(""), 1500);

    return true;
  }

  function geoSafeNum(n: number | null): number {
    if (typeof n !== "number" || !Number.isFinite(n)) {
      throw new Error("Resolved coordinates missing.");
    }
    return n;
  }

  function buildPayloadText(lat: number, lon: number): AstroPayloadText {
    const y = Number(birthDate.slice(0, 4));
    const mo = Number(birthDate.slice(5, 7));
    const da = Number(birthDate.slice(8, 10));
    const hh = Number(birthTime.slice(0, 2));
    const mi = Number(birthTime.slice(3, 5));

    const offMin = computeOffsetForLocalWallTime(y, mo, da, hh, mi, timeZone);
    const tz_offset = offsetMinutesToString(offMin);

    return [
      `birth_datetime: ${fmtBirthDatetime(birthDate, birthTime)}`,
      `as_of_date: ${asOfDate}`,
      `tz_offset: ${tz_offset}`,
      `lat: ${lat}`,
      `lon: ${lon}`,
    ].join("\n");
  }

  async function onGenerateClick() {
    if (loading) return;

    setLoading(true);
    setStatusLine("");
    setLocationNudge("");

    try {
      if (!hasResolvedLocation) {
        const q = birthCityState.trim();
        if (!q) {
          setLocationNudge("Enter a City, State, then Resolve.");
          return;
        }

        const ok = await resolveLocation();
        if (!ok) return;
      }

      const lat = geoSafeNum(resolvedLat);
      const lon = geoSafeNum(resolvedLon);

      const payloadText = buildPayloadText(lat, lon);

      setStatusLine("Generating…");
      await onGenerate(payloadText);
      setStatusLine("");
    } catch (e: any) {
      setStatusLine(e?.message ?? "Generate failed.");
    } finally {
      setLoading(false);
    }
  }

  const generateLooksDisabled = !hasResolvedLocation;

  return (
    <div className="w-full rounded-xl bg-[#0b0b0c] border border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-neutral-400">{title}</div>

        <button
          onClick={onGenerateClick}
          className={[
            "text-sm px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-50",
            generateLooksDisabled ? "opacity-50" : "",
          ].join(" ")}
          disabled={loading}
          aria-disabled={generateLooksDisabled || loading}
          title={
            generateLooksDisabled
              ? "Resolve location before generating (or click Generate to auto-resolve)."
              : "Generate"
          }
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      <div className="text-[12px] text-neutral-400 mb-2">Birth</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] text-neutral-500 mb-1">Birth date</div>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-md bg-black/40 border border-neutral-800 px-3 py-2 text-[13px] outline-none"
            style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
          />
        </div>

        <div>
          <div className="text-[11px] text-neutral-500 mb-1">Birth time</div>
          <div className="flex gap-2">
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full rounded-md bg-black/40 border border-neutral-800 px-3 py-2 text-[13px] outline-none"
              style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
            />
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="min-w-[110px] rounded-md bg-black/40 border border-neutral-800 px-2 py-2 text-[13px] outline-none text-neutral-100"
              style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
              title="Time zone (IANA)"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {TZ_ABBREVIATIONS[tz.value] ?? tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[11px] text-neutral-500 mb-1">
          Birth location (City, State)
        </div>

        <div className="flex gap-2">
          <input
            value={birthCityState}
            onChange={(e) => {
              const v = e.target.value;
              setBirthCityState(v);

              setResolvedLat(null);
              setResolvedLon(null);
              setResolvedLabel("");
              setLocationNudge("");
            }}
            placeholder="Danville, VA"
            className="w-full rounded-md bg-black/40 border border-neutral-800 px-3 py-2 text-[13px] outline-none"
            style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
          />

          <button
            type="button"
            onClick={async () => {
              if (loading) return;
              const q = birthCityState.trim();
              if (!q) {
                setLocationNudge("Enter a City, State, then Resolve.");
                return;
              }
              await resolveLocation();
            }}
            className="text-sm px-3 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-50"
            disabled={loading}
          >
            Resolve
          </button>
        </div>

        {locationNudge ? (
          <div className="mt-2 text-[12px] text-neutral-400">{locationNudge}</div>
        ) : null}

        <div className="mt-2 text-[12px] text-neutral-500">
          {hasResolvedLocation ? (
            <div className="space-y-1">
              {resolvedLabel ? (
                <div className="text-neutral-400">
                  Resolved to: <span className="text-neutral-200">{resolvedLabel}</span>
                </div>
              ) : (
                <div className="text-neutral-400">Resolved.</div>
              )}

              <div className="text-neutral-600">
                lat: <span className="text-neutral-400">{resolvedLat}</span> • lon:{" "}
                <span className="text-neutral-400">{resolvedLon}</span>
              </div>
            </div>
          ) : (
            <>Location not resolved yet.</>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-neutral-900">
        <div className="text-[12px] text-neutral-400 mb-2">As-of</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-neutral-500 mb-1">As-of date</div>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              disabled={lockAsOfToToday}
              className="w-full rounded-md bg-black/40 border border-neutral-800 px-3 py-2 text-[13px] outline-none disabled:opacity-60"
              style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
              title={lockAsOfToToday ? "As-of date is locked to today on this page." : "As-of date"}
            />
          </div>

          <div className="flex items-end">
            <div className="text-[11px] text-neutral-500">
              {lockAsOfToToday
                ? "as_of_date is locked to today (local)."
                : "tz_offset is computed automatically from your selected time zone + birth time (DST-safe)."}
            </div>
          </div>
        </div>
      </div>

      {statusLine ? (
        <div className="mt-3 text-[12px] text-neutral-400">{statusLine}</div>
      ) : null}

      <details className="mt-4">
        <summary className="text-[12px] text-neutral-500 cursor-pointer select-none">
          Debug payload (what gets sent to the APIs)
        </summary>
        <pre
          className="mt-2 rounded-lg bg-black/40 border border-neutral-900 p-3 text-[12px] leading-5 whitespace-pre-wrap break-words"
          style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
        >
          {debugPayload || "Resolve a location to see the payload."}
        </pre>
      </details>
    </div>
  );
}
