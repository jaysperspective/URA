// web/src/app/lunation/page.tsx
"use client";

import React, { useMemo, useState } from "react";

export default function LunationConsolePage() {
  const [input, setInput] = useState(
`birth_datetime: 1990-01-24 01:39
as_of_date: 2025-12-19
tz_offset: -05:00`
  );
  const [out, setOut] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const placeholder = useMemo(
    () =>
      [
        "birth_datetime: YYYY-MM-DD HH:MM",
        "as_of_date: YYYY-MM-DD  (optional, defaults today)",
        "tz_offset: -05:00      (optional, defaults -05:00)",
      ].join("\n"),
    []
  );

  async function run() {
    setLoading(true);
    setOut("");
    try {
      const res = await fetch("/api/lunation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!res.ok) setOut(`ERROR\n${data?.error ?? "Unknown error"}`);
      else setOut(data.text);
    } catch (e: any) {
      setOut(`ERROR\n${e?.message ?? String(e)}`);
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
            className="text-sm px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600"
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

        <pre
          className="w-full mt-4 rounded-xl bg-[#0b0b0c] border border-neutral-800 p-4 text-[13px] leading-5 whitespace-pre-wrap"
          style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
        >
          {out || "Output will appear here."}
        </pre>
      </div>
    </div>
  );
}
