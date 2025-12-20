// web/src/app/lunation/page.tsx
"use client";

import React, { useMemo, useState } from "react";

type GeoResult =
  | { ok: true; lat: number; lon: number; display_name?: string; cached?: boolean }
  | { ok: false; error: string };

const TIMEZONES = [
  { label: "Eastern (America/New_York)", value: "America/New_York" },
  { label: "Central (America/Chicago)", value: "America/Chicago" },
  { label: "Mountain (America/Denver)", value: "America/Denver" },
  { label: "Pacific (America/Los_Angeles)", value: "America/Los_Angeles" },
  { label: "UTC", value: "UTC" },
] as const;

// ---- Timezone offset helpers (no libs) ----
// We compute tz_offset for a *local wall time* (birth date+time) in a chosen IANA timezone.
// This handles DST by iterating to find the correct instant.
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
  // Start with a naive guess: interpret wall time as UTC, then iterate.
  let guessUTC = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 4; i++) {
    const off = offsetMinutesAtInstant(new Date(guessUTC), timeZone);
    const nextGuess = Date.UTC(year, month - 1, day, hour, minute, 0) - off * 60_000;
    if (Math.abs(nextGuess - guessUTC) < 1_000) {
      guessUTC = nextGuess;
      break;
    }
    guessUTC = nextGuess;
  }

  // Return offset minutes where negative => "-HH:MM" (e.g. -300 => -05:00)
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
  // birthDate: YYYY-MM-DD, birthTime: HH:MM
  return `${birthDate} ${birthTime}`;
}

function pretty(x: any) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

export default function LunationConsolePage() {
  // Default values aligned with your screenshot
  const [birthDate, setBirthDate] = useState("1990-01-24");
  const [birthTime, setBirthTime] = useState("01:39");
  const [timeZone, setTimeZone] = useState<string>("America/New_York");

  const [birthCityState, setBirthCityState] = useState("Danville, VA");
  const [resolvedLat, setResolvedLat] = useState<number | null>(36.585);
  const [resolvedLon, setResolvedLon] = useState<number | null>(-79.395);
  const [resolvedLabel, setResolvedLabel] = useState<string>("");

  const [asOfDate, setAsOfDate] = useState("2025-12-19");

  const [lunationOut, setLunationOut] = useState<string>("");
  const [ascYearOut, setAscYearOut] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [statusLine, setStatusLine] = useState<string>("");

  const debugPayload = useMemo(() => {
    // Shows the raw text that we POST to both endpoints (useful for sanity)
    if (!resolvedLat || !resolvedLon) return "";
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
  }, [birthDate, birthTime, timeZone, asOfDate, resolvedLat, resolvedLon]);

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

  async function postText(endpoint: string, text: string) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: text,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      const raw = await res.text().catch(() => "");
      data = { ok: false, error: "Non-JSON response", raw };
    }

    return { res, data };
  }

  async function run() {
    setLoading(true);
    setLunationOut("");
    setAscYearOut("");
    setStatusLine("");

    try {
      // 1) Ensure we have lat/lon (geocode if not)
      let lat = resolvedLat;
      let lon = resolvedLon;

      if (lat == null || lon == null) {
        const geo = await geocodeCityState();
        if (!geo.ok) throw new Error(geo.error);
        lat = geo.lat;
        lon = geo.lon;
        setResolvedLat(lat);
        setResolvedLon(lon);
        setResolvedLabel(geo.display_name ?? "");
      }

      // 2) Compute tz_offset from selected IANA timezone + birth wall time
      const y = Number(birthDate.slice(0, 4));
      const mo = Number(birthDate.slice(5, 7));
      const da = Number(birthDate.slice(8, 10));
      const hh = Number(birthTime.slice(0, 2));
      const mi = Number(birthTime.slice(3, 5));

      const offMin = computeOffsetForLocalWallTime(y, mo, da, hh, mi, timeZone);
      const tz_offset = offsetMinutesToString(offMin);

      // 3) Build plain-text payload for both endpoints (same input)
      const payload = [
        `birth_datetime: ${fmtBirthDatetime(birthDate, birthTime)}`,
        `as_of_date: ${asOfDate}`,
        `tz_offset: ${tz_offset}`,
        `lat: ${lat}`,
        `lon: ${lon}`,
      ].join("\n");

      setStatusLine("Generating…");

      const [lun, asc] = await Promise.all([
        postText("/api/lunation", payload),
        postText("/api/asc-year", payload),
      ]);

      // Lunation: show clean text if present
      if (!lun.res.ok || lun.data?.ok === false) {
        setLunationOut(`ERROR\n${lun.data?.error ?? `HTTP ${lun.res.status}`}`);
      } else {
        setLunationOut(
          typeof lun.data?.text === "string" ? lun.data.text : pretty(lun.data)
        );
      }

      // Asc-year: prefer `text` too (we added it in that route)
      if (!asc.res.ok || asc.data?.ok === false) {
        setAscYearOut(
          `ERROR\n${pretty({
            status: asc.res.status,
            error: asc.data?.error ?? "Unknown error",
            response: asc.data,
          })}`
        );
      } else {
        setAscYearOut(
          typeof asc.data?.text === "string" ? asc.data.text : pretty(asc.data)
        );
      }

      setStatusLine("");
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setLunationOut(`ERROR\n${msg}`);
      setAscYearOut(`ERROR\n${msg}`);
      setStatusLine("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100svh] bg-black text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-neutral-400">
            URA • Progressed Lunation Console
          </div>
          <button
            onClick={run}
            className="text-sm px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>

        {/* INPUT PANEL */}
        <div className="w-full rounded-xl bg-[#0b0b0c] border border-neutral-800 p-4">
          {/* Birth section */}
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
                  className="min-w-[220px] rounded-md bg-black/40 border border-neutral-800 px-2 py-2 text-[13px] outline-none text-neutral-100"
                  style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                  title="Time zone (IANA)"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location section */}
          <div className="mt-4">
            <div className="text-[11px] text-neutral-500 mb-1">Birth location (City, State)</div>
            <div className="flex gap-2">
              <input
                value={birthCityState}
                onChange={(e) => setBirthCityState(e.target.value)}
                placeholder="Danville, VA"
                className="w-full rounded-md bg-black/40 border border-neutral-800 px-3 py-2 text-[13px] outline-none"
                style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
              />
              <button
                type="button"
                onClick={async () => {
                  setResolvedLat(null);
                  setResolvedLon(null);
                  setResolvedLabel("");
                  const geo = await geocodeCityState();
                  if (!geo.ok) {
                    setStatusLine(`Location error: ${geo.error}`);
                    return;
                  }
                  setResolvedLat(geo.lat);
                  setResolvedLon(geo.lon);
                  setResolvedLabel(geo.display_name ?? "");
                  setStatusLine(geo.cached ? "Location resolved (cached)." : "Location resolved.");
                  setTimeout(() => setStatusLine(""), 1500);
                }}
                className="text-sm px-3 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-50"
                disabled={loading}
              >
                Resolve
              </button>
            </div>

            <div className="mt-2 text-[12px] text-neutral-500">
              {resolvedLat != null && resolvedLon != null ? (
                <>
                  lat: <span className="text-neutral-300">{resolvedLat}</span> • lon:{" "}
                  <span className="text-neutral-300">{resolvedLon}</span>
                  {resolvedLabel ? (
                    <>
                      {" "}
                      • <span className="text-neutral-400">{resolvedLabel}</span>
                    </>
                  ) : null}
                </>
              ) : (
                <>Location not resolved yet.</>
              )}
            </div>
          </div>

          {/* As-of section */}
          <div className="mt-5 pt-4 border-t border-neutral-900">
            <div className="text-[12px] text-neutral-400 mb-2">As-of</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-neutral-500 mb-1">As-of date</div>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-full rounded-md bg-black/40 border border-neutral-800 px-3 py-2 text-[13px] outline-none"
                  style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                />
              </div>

              <div className="flex items-end">
                <div className="text-[11px] text-neutral-500">
                  tz_offset is computed automatically from your selected time zone + birth time (DST-safe).
                </div>
              </div>
            </div>
          </div>

          {statusLine ? (
            <div className="mt-3 text-[12px] text-neutral-400">{statusLine}</div>
          ) : null}

          {/* Debug (raw payload preview) */}
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

        {/* OUTPUTS */}
        <div className="w-full mt-4 rounded-xl bg-[#0b0b0c] border border-neutral-800 p-4">
          <div className="text-[12px] text-neutral-400 mb-2">
            URA • Progressed Lunation Model (raw)
          </div>
          <pre
            className="text-[13px] leading-5 whitespace-pre-wrap break-words"
            style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
          >
            {lunationOut || "Output will appear here."}
          </pre>
        </div>

        <div className="w-full mt-4 rounded-xl bg-[#0b0b0c] border border-neutral-800 p-4">
          <div className="text-[12px] text-neutral-400 mb-2">
            URA • Ascendant Year Cycle (raw)
          </div>
          <pre
            className="text-[13px] leading-5 whitespace-pre-wrap break-words"
            style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
          >
            {ascYearOut || "Output will appear here."}
          </pre>
        </div>
      </div>
    </div>
  );
}
