"use client";

import React, { useState } from "react";
import AstroInputForm, {
  type AstroPayloadText,
} from "@/components/astro/AstroInputForm";

type Target = "payload" | "lunation" | "asc-year" | "both";

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

export default function UniversalInputPage() {
  const [target, setTarget] = useState<Target>("payload");

  const [payloadOut, setPayloadOut] = useState<string>("");
  const [lunationOut, setLunationOut] = useState<string>("");
  const [ascYearOut, setAscYearOut] = useState<string>("");
  const [statusLine, setStatusLine] = useState<string>("");

  async function handleGenerate(payloadText: AstroPayloadText) {
    // Always show payload (this is a “universal input” surface)
    setPayloadOut(payloadText);

    // Clear previous outputs for a fresh run
    setLunationOut("");
    setAscYearOut("");
    setStatusLine("");

    if (target === "payload") return;

    try {
      setStatusLine("Running…");

      if (target === "lunation") {
        const lun = await postText("/api/lunation", payloadText);

        if (!lun.res.ok || lun.data?.ok === false) {
          setLunationOut(`ERROR\n${lun.data?.error ?? `HTTP ${lun.res.status}`}`);
        } else {
          setLunationOut(
            typeof lun.data?.text === "string" ? lun.data.text : pretty(lun.data)
          );
        }
      }

      if (target === "asc-year") {
        const asc = await postText("/api/asc-year", payloadText);

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
      }

      if (target === "both") {
        const [lun, asc] = await Promise.all([
          postText("/api/lunation", payloadText),
          postText("/api/asc-year", payloadText),
        ]);

        if (!lun.res.ok || lun.data?.ok === false) {
          setLunationOut(`ERROR\n${lun.data?.error ?? `HTTP ${lun.res.status}`}`);
        } else {
          setLunationOut(
            typeof lun.data?.text === "string" ? lun.data.text : pretty(lun.data)
          );
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
          setAscYearOut(
            typeof asc.data?.text === "string" ? asc.data.text : pretty(asc.data)
          );
        }
      }

      setStatusLine("");
    } catch (e: any) {
      setStatusLine("");
      const msg = e?.message ?? String(e);
      // Put the error somewhere visible without being noisy
      setLunationOut((prev) => prev || `ERROR\n${msg}`);
      setAscYearOut((prev) => prev || `ERROR\n${msg}`);
    }
  }

  return (
    <div className="min-h-[100svh] bg-black text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-400">URA • Universal Input</div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-neutral-500">Target</div>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as Target)}
              className="rounded-md bg-black/40 border border-neutral-800 px-2 py-1.5 text-[13px] outline-none text-neutral-100"
              style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
              title="Choose what Generate runs"
            >
              <option value="payload">Payload only</option>
              <option value="lunation">Lunation</option>
              <option value="asc-year">Ascendant Year</option>
              <option value="both">Both (Lunation + Asc-Year)</option>
            </select>
          </div>
        </div>

        {/* Form */}
        <AstroInputForm
          title="URA • Input Contract"
          randomizeBirthDate
          lockAsOfToToday
          initial={{
            birthTime: "01:39",
            timeZone: "America/New_York",
            birthCityState: "Danville, VA",
            lat: 36.585,
            lon: -79.395,
          }}
          onGenerate={handleGenerate}
        />


        {statusLine ? (
          <div className="text-[12px] text-neutral-400">{statusLine}</div>
        ) : null}

        {/* Payload output */}
        <div className="w-full rounded-xl bg-[#0b0b0c] border border-neutral-800 p-4">
          <div className="text-[12px] text-neutral-400 mb-2">
            URA • Generated Payload (text/plain)
          </div>

          <pre
            className="text-[13px] leading-5 whitespace-pre-wrap break-words"
            style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
          >
            {payloadOut ||
              "Generate to see the payload that will be sent to URA endpoints."}
          </pre>
        </div>

        {/* Optional outputs based on target */}
        {(target === "lunation" || target === "both") && (
          <div className="w-full rounded-xl bg-[#0b0b0c] border border-neutral-800 p-4">
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
        )}

        {(target === "asc-year" || target === "both") && (
          <div className="w-full rounded-xl bg-[#0b0b0c] border border-neutral-800 p-4">
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
        )}
      </div>
    </div>
  );
}
