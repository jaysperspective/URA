// web/src/app/lunation/page.tsx
"use client";

import React, { useMemo, useState } from "react";

export default function LunationConsolePage() {
  const [input, setInput] = useState(
    `birth_datetime: 1990-01-24 01:39
as_of_date: 2025-12-19
tz_offset: -05:00
lat: 36.585
lon: -79.395`
  );

  const [lunationOut, setLunationOut] = useState<string>("");
  const [ascYearOut, setAscYearOut] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const placeholder = useMemo(
    () =>
      [
        "birth_datetime: YYYY-MM-DD HH:MM",
        "as_of_date: YYYY-MM-DD",
        "tz_offset: -05:00",
        "lat: 36.585",
        "lon: -79.395",
      ].join("\n"),
    []
  );

  function pretty(x: any) {
    try {
      return JSON.stringify(x, null, 2);
    } catch {
      return String(x);
    }
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

    try {
      const [lun, asc] = await Promise.all([
        postText("/api/lunation", input),
        postText("/api/asc-year", input),
      ]);

      // ✅ LUNATION: show clean text block
      if (!lun.res.ok || lun.data?.ok === false) {
        setLunationOut(
          `ERROR\n${lun.data?.error ?? `HTTP ${lun.res.status}`}`
        );
      } else {
        const t =
          typeof lun.data?.text === "string" ? lun.data.text : pretty(lun.data);
        setLunationOut(t);
      }

      // ✅ ASC YEAR: prefer clean text, fallback to raw JSON
      if (!asc.res.ok || asc.data?.ok === false) {
        setAscYearOut(
          `ERROR\n${pretty({
            status: asc.res.status,
            error: asc.data?.error ?? "Unknown error",
            response: asc.data,
          })}`
        );
      } else {
        const t =
          typeof asc.data?.text === "string" ? asc.data.text : pretty(asc.data);
        setAscYearOut(t);
      }
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setLunationOut(`ERROR\n${msg}`);
      setAscYearOut(`ERROR\n${msg}`);
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

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="w-full h-[220px] rounded-xl bg-[#0b0b0c] border border-neutral-800 p-4 text-[13px] leading-5 outline-none"
          style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
          spellCheck={false}
        />

        {/* Progressed Lunation output */}
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

        {/* Ascendant Year output */}
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
