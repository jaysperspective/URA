// web/src/app/lunation/page.tsx
"use client";

import React, { useState } from "react";
import AstroInputForm, { type AstroPayloadText } from "@/components/astro/AstroInputForm";

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

export default function LunationConsolePage() {
  const [lunationOut, setLunationOut] = useState<string>("");
  const [ascYearOut, setAscYearOut] = useState<string>("");

  async function handleGenerate(payloadText: AstroPayloadText) {
    setLunationOut("");
    setAscYearOut("");

    const [lun, asc] = await Promise.all([
      postText("/api/lunation", payloadText),
      postText("/api/asc-year", payloadText),
    ]);

    if (!lun.res.ok || lun.data?.ok === false) {
      setLunationOut(`ERROR\n${lun.data?.error ?? `HTTP ${lun.res.status}`}`);
    } else {
      setLunationOut(typeof lun.data?.text === "string" ? lun.data.text : pretty(lun.data));
    }

    if (!asc.res.ok || asc.data?.ok === false) {
      setAscYearOut(
        `ERROR\n${pretty({
          status: asc.res.status,
          error: asc.data?.error ?? "Unknown error",
          response: asc.data,
        })}`
      );
    } else {
      setAscYearOut(typeof asc.data?.text === "string" ? asc.data.text : pretty(asc.data));
    }
  }

  return (
    <div className="min-h-[100svh] bg-black text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <AstroInputForm
          title="URA • Progressed Lunation Console"
          initial={{
            birthDate: "1990-01-24",
            birthTime: "01:39",
            timeZone: "America/New_York",
            birthCityState: "Danville, VA",
            asOfDate: "2025-12-19",
            lat: 36.585,
            lon: -79.395,
          }}
          onGenerate={handleGenerate}
        />

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
