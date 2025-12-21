// src/app/lunation/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AstroInputForm, { type AstroPayloadText } from "@/components/astro/AstroInputForm";

const LS_PAYLOAD_KEY = "ura:lastPayloadText";

type AstroFormInitial = {
  birthDate?: string;
  birthTime?: string;
  timeZone?: string;
  birthCityState?: string;
  lat?: number;
  lon?: number;
  asOfDate?: string;
};

function safeParsePayloadTextToInitial(payloadText: string): Partial<AstroFormInitial> {
  const get = (k: string) => {
    const re = new RegExp(`^\\s*${k}\\s*:\\s*(.+?)\\s*$`, "mi");
    const m = payloadText.match(re);
    return m?.[1]?.trim() ?? null;
  };

  const birthDT = get("birth_datetime");
  const asOf = get("as_of_date");
  const latRaw = get("lat");
  const lonRaw = get("lon");

  let birthDate: string | undefined;
  let birthTime: string | undefined;

  if (birthDT) {
    const m = birthDT.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/);
    if (m) {
      birthDate = m[1];
      birthTime = m[2];
    }
  }

  const lat = latRaw ? Number(latRaw) : undefined;
  const lon = lonRaw ? Number(lonRaw) : undefined;

  return {
    birthDate,
    birthTime,
    timeZone: "America/New_York",
    birthCityState: "",
    lat: Number.isFinite(lat as number) ? (lat as number) : undefined,
    lon: Number.isFinite(lon as number) ? (lon as number) : undefined,
    asOfDate: asOf ?? undefined,
  };
}

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
  const [payloadOut, setPayloadOut] = useState<string>("");

  const [savedPayload, setSavedPayload] = useState<string>("");

  useEffect(() => {
    try {
      const x = window.localStorage.getItem(LS_PAYLOAD_KEY) || "";
      setSavedPayload(x);
      if (x) setPayloadOut(x);
    } catch {
      // ignore
    }
  }, []);

  const initial = useMemo<AstroFormInitial>(() => {
    if (!savedPayload) return {};
    return safeParsePayloadTextToInitial(savedPayload);
  }, [savedPayload]);

  function persistPayload(payloadText: string) {
    try {
      window.localStorage.setItem(LS_PAYLOAD_KEY, payloadText);
      setSavedPayload(payloadText);
    } catch {
      // ignore
    }
  }

  async function handleGenerate(payloadText: AstroPayloadText) {
    setPayloadOut(payloadText);
    persistPayload(payloadText);

    setLunationOut("");
    setAscYearOut("");

    const [lun, asc] = await Promise.all([
      postText("/api/lunation", payloadText),
      postText("/api/asc-year", payloadText),
    ]);

    if (!lun.res.ok || lun.data?.ok === false) {
      setLunationOut(pretty({ status: lun.res.status, error: lun.data?.error, data: lun.data }));
    } else {
      setLunationOut(lun.data?.text ? String(lun.data.text) : pretty(lun.data));
    }

    if (!asc.res.ok || asc.data?.ok === false) {
      setAscYearOut(pretty({ status: asc.res.status, error: asc.data?.error, data: asc.data }));
    } else {
      setAscYearOut(asc.data?.text ? String(asc.data.text) : pretty(asc.data));
    }
  }

  return (
    <div className="min-h-[100svh] bg-black text-neutral-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-5">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase">
                URA • Lunation
              </div>
              <div className="mt-2 text-[26px] leading-[1.05] font-semibold">
                Progressed Lunation + Ascendant Year Cycle
              </div>
              <div className="mt-2 text-[13px] text-neutral-400">
                Uses the same saved input as /input and /seasons.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/input"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-[12px] text-neutral-100 hover:bg-neutral-800"
              >
                Edit input
              </Link>
              <Link
                href="/seasons"
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-[12px] text-neutral-100 hover:bg-neutral-800"
              >
                Go to /seasons
              </Link>
            </div>
          </div>
        </div>

        <AstroInputForm
          title="URA • Input"
          lockAsOfToToday
          initial={{
            birthTime: initial.birthTime ?? "01:39",
            timeZone: initial.timeZone ?? "America/New_York",
            birthCityState: initial.birthCityState ?? "Danville, VA",
            lat: typeof initial.lat === "number" ? initial.lat : 36.585,
            lon: typeof initial.lon === "number" ? initial.lon : -79.395,
          }}
          onGenerate={handleGenerate}
        />

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase mb-2">
            Payload (text/plain)
          </div>
          <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-neutral-200">
            {payloadOut || "Generate to view the request payload."}
          </pre>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase mb-2">
              URA • Progressed Lunation Model
            </div>
            <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-neutral-200">
              {lunationOut || "Generate to run /api/lunation."}
            </pre>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase mb-2">
              URA • Ascendant Year Cycle
            </div>
            <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-neutral-200">
              {ascYearOut || "Generate to run /api/asc-year."}
            </pre>
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 px-1">
          Reuses the last saved payload from <span className="text-neutral-300">{LS_PAYLOAD_KEY}</span>.
        </div>
      </div>
    </div>
  );
}
