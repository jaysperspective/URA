// web/src/app/input/page.tsx

"use client";

import React, { useState } from "react";
import AstroInputForm, {
  type AstroPayloadText,
} from "@/components/astro/AstroInputForm";

export default function UniversalInputPage() {
  const [payloadOut, setPayloadOut] = useState<string>("");

  async function handleGenerate(payloadText: AstroPayloadText) {
    // For now, this page is the canonical “payload builder”.
    // Later, you can:
    // - call a selected endpoint
    // - route to /lunation with query params
    // - store payload in state/store
    setPayloadOut(payloadText);
  }

  return (
    <div className="min-h-[100svh] bg-black text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <AstroInputForm
          title="URA • Universal Input"
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
            URA • Generated Payload (text/plain)
          </div>

          <pre
            className="text-[13px] leading-5 whitespace-pre-wrap break-words"
            style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
          >
            {payloadOut || "Generate to see the payload that will be sent to URA endpoints."}
          </pre>

          <div className="mt-3 text-[12px] text-neutral-500">
            This page is your universal input surface. Next step: add a target
            dropdown (Lunation / Asc-Year / Natal / Transits) and route/call accordingly.
          </div>
        </div>
      </div>
    </div>
  );
}
