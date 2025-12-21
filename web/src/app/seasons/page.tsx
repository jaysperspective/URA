// web/src/app/seasons/page.tsx

"use client";

import React, { useMemo, useState } from "react";
import AstroInputForm, {
  type AstroPayloadText,
} from "@/components/astro/AstroInputForm";

type TargetData = any;

function safeJsonStringify(x: any) {
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

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function degNorm(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

/**
 * Attempt to extract asc-year fields regardless of shape.
 * We keep this flexible so your API can evolve without breaking the UI.
 */
function extractAscYear(data: TargetData) {
  const root = data?.data ?? data;

  // common candidates
  const season =
    root?.season ??
    root?.Season ??
    root?.result?.season ??
    root?.result?.Season ??
    root?.ascYear?.season ??
    root?.ascYear?.Season ??
    null;

  const modality =
    root?.modality ??
    root?.Modality ??
    root?.result?.modality ??
    root?.result?.Modality ??
    root?.ascYear?.modality ??
    root?.ascYear?.Modality ??
    null;

  // degrees / positioning (optional)
  const cyclePosition =
    root?.cyclePosition ??
    root?.cycle_position ??
    root?.position ??
    root?.result?.cyclePosition ??
    root?.ascYear?.cyclePosition ??
    null;

  const segmentStart =
    root?.segmentStart ??
    root?.segment_start ??
    root?.phaseStart ??
    root?.result?.segmentStart ??
    root?.ascYear?.segmentStart ??
    null;

  const segmentEnd =
    root?.segmentEnd ??
    root?.segment_end ??
    root?.phaseEnd ??
    root?.result?.segmentEnd ??
    root?.ascYear?.segmentEnd ??
    null;

  const natalASC =
    root?.natalASC ??
    root?.natalAsc ??
    root?.ascendant ??
    root?.result?.natalASC ??
    root?.ascYear?.natalASC ??
    null;

  const transitingSun =
    root?.transitingSunLon ??
    root?.sunLon ??
    root?.transitSun ??
    root?.result?.transitingSunLon ??
    root?.ascYear?.transitingSunLon ??
    null;

  // Derive a 0..1 progress for the current 30° segment if possible
  let segmentProgress = null as number | null;
  if (
    typeof cyclePosition === "number" &&
    typeof segmentStart === "number" &&
    typeof segmentEnd === "number"
  ) {
    const pos = degNorm(cyclePosition);
    const start = degNorm(segmentStart);
    const end = degNorm(segmentEnd);

    // segment spans 30° but may wrap; compute forward distance on a circle
    const span = degNorm(end - start);
    const dist = degNorm(pos - start);
    if (span > 0) segmentProgress = clamp01(dist / span);
  }

  // If no explicit segment start/end, infer from cyclePosition within 30° bucket
  if (segmentProgress == null && typeof cyclePosition === "number") {
    const pos = degNorm(cyclePosition);
    segmentProgress = (pos % 30) / 30;
  }

  // If cyclePosition missing, but maybe you return "degIntoCycle"
  if (segmentProgress == null) segmentProgress = 0;

  return {
    season: typeof season === "string" ? season : null,
    modality: typeof modality === "string" ? modality : null,
    cyclePosition: typeof cyclePosition === "number" ? cyclePosition : null,
    segmentStart: typeof segmentStart === "number" ? segmentStart : null,
    segmentEnd: typeof segmentEnd === "number" ? segmentEnd : null,
    segmentProgress,
    natalASC: typeof natalASC === "number" ? natalASC : null,
    transitingSun: typeof transitingSun === "number" ? transitingSun : null,
  };
}

function earthToneLabel(season: string | null) {
  // Earth-toned vibe mapping (not strict astrology element mapping—pure UI tone)
  const s = (season ?? "").toLowerCase();
  if (s.includes("spring")) return { accent: "bg-[#7a8f5a]", glow: "shadow-[#7a8f5a]/30" };
  if (s.includes("summer")) return { accent: "bg-[#b07a3a]", glow: "shadow-[#b07a3a]/30" };
  if (s.includes("fall") || s.includes("autumn"))
    return { accent: "bg-[#8a4b2a]", glow: "shadow-[#8a4b2a]/30" };
  if (s.includes("winter")) return { accent: "bg-[#4b6a6a]", glow: "shadow-[#4b6a6a]/30" };
  return { accent: "bg-[#6b6b6b]", glow: "shadow-[#6b6b6b]/30" };
}

function prettySeason(season: string | null) {
  if (!season) return "—";
  return season.charAt(0).toUpperCase() + season.slice(1);
}
function prettyModality(modality: string | null) {
  if (!modality) return "—";
  return modality.charAt(0).toUpperCase() + modality.slice(1);
}

function Meter({
  value01,
  label,
}: {
  value01: number;
  label: string;
}) {
  const pct = Math.round(clamp01(value01) * 100);
  return (
    <div className="rounded-xl border border-[#2a241d] bg-[#0f0d0a] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] text-[#c7b9a6]">{label}</div>
        <div
          className="text-[12px] text-[#a8967c]"
          style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
        >
          {pct}%
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-[#1a1510] overflow-hidden">
        <div
          className="h-2 rounded-full bg-[#c2a06f]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 text-[11px] text-[#8f7f6a]">
        Progress through the current 30° boundary.
      </div>
    </div>
  );
}

function SeasonWheel({ progress01 }: { progress01: number }) {
  // Simple SVG ring with a single hand
  const r = 58;
  const cx = 70;
  const cy = 70;
  const angle = -90 + clamp01(progress01) * 360;
  const rad = (Math.PI / 180) * angle;
  const x2 = cx + r * Math.cos(rad);
  const y2 = cy + r * Math.sin(rad);

  return (
    <div className="rounded-2xl border border-[#2a241d] bg-[#0f0d0a] p-4">
      <div className="text-[12px] text-[#c7b9a6] mb-2">Season Wheel</div>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a241d" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#c2a06f" strokeWidth="10" strokeDasharray="4 10" opacity="0.35" />
        <circle cx={cx} cy={cy} r="3.2" fill="#c2a06f" />
        <line
          x1={cx}
          y1={cy}
          x2={x2}
          y2={y2}
          stroke="#c2a06f"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-2 text-[11px] text-[#8f7f6a]">
        A quiet marker showing your current placement within the cycle.
      </div>
    </div>
  );
}

export default function SeasonsPage() {
  const [payloadOut, setPayloadOut] = useState<string>("");
  const [rawOut, setRawOut] = useState<string>("");
  const [statusLine, setStatusLine] = useState<string>("");

  const [ascData, setAscData] = useState<TargetData | null>(null);

  const extracted = useMemo(() => extractAscYear(ascData), [ascData]);
  const tones = useMemo(() => earthToneLabel(extracted.season), [extracted.season]);

  async function handleGenerate(payloadText: AstroPayloadText) {
    setPayloadOut(payloadText);
    setRawOut("");
    setAscData(null);
    setStatusLine("Running Ascendant Year Cycle…");

    const res = await postText("/api/asc-year", payloadText);

    if (!res.res.ok || res.data?.ok === false) {
      setStatusLine("");
      setRawOut(
        `ERROR\n${safeJsonStringify({
          status: res.res.status,
          error: res.data?.error ?? "Unknown error",
          response: res.data,
        })}`
      );
      return;
    }

    setAscData(res.data);
    setStatusLine("");
    setRawOut(typeof res.data?.text === "string" ? res.data.text : "");
  }

  return (
    <div className="min-h-[100svh] bg-[#0b0906] text-[#efe6d8] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-5">
        {/* Top banner */}
        <div className="rounded-2xl border border-[#2a241d] bg-gradient-to-b from-[#0f0d0a] to-[#0b0906] p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
                URA • Seasons
              </div>
              <div className="mt-2 text-[34px] leading-[1.05] font-semibold">
                {prettySeason(extracted.season)}{" "}
                <span className="text-[#b9a88f] font-normal">
                  • {prettyModality(extracted.modality)}
                </span>
              </div>
              <div className="mt-2 text-[13px] text-[#b9a88f] max-w-xl">
                A seasonal read of your Ascendant Year Cycle: anchored to natal ASC, moved by the
                transiting Sun.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${tones.accent} shadow-lg ${tones.glow}`}
                aria-hidden="true"
              />
              <div className="text-[12px] text-[#b9a88f]">
                Earth-tone theme keyed to the current season
              </div>
            </div>
          </div>

          {statusLine ? (
            <div className="mt-4 text-[12px] text-[#c7b9a6]">{statusLine}</div>
          ) : null}
        </div>

        {/* Form + Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <AstroInputForm
              title="URA • Universal Input"
              defaultAsOfToToday
              initial={{
                birthDate: "1990-01-24",
                birthTime: "01:39",
                timeZone: "America/New_York",
                birthCityState: "Danville, VA",
                lat: 36.585,
                lon: -79.395,
              }}
              onGenerate={handleGenerate}
            />

            <div className="rounded-2xl border border-[#2a241d] bg-[#0f0d0a] p-4">
              <div className="text-[12px] text-[#c7b9a6] mb-2">
                Payload (text/plain)
              </div>
              <pre
                className="text-[12px] leading-5 whitespace-pre-wrap break-words text-[#d9cfbf]"
                style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
              >
                {payloadOut || "Generate to view the request payload."}
              </pre>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SeasonWheel progress01={extracted.segmentProgress ?? 0} />
              <Meter
                value01={extracted.segmentProgress ?? 0}
                label="30° Boundary Progress"
              />
            </div>

            <div className="rounded-2xl border border-[#2a241d] bg-[#0f0d0a] p-6">
              <div className="text-[12px] tracking-[0.18em] text-[#b9a88f] uppercase">
                Details
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#2a241d] bg-[#0b0906] p-4">
                  <div className="text-[11px] text-[#b9a88f]">Cycle Position</div>
                  <div
                    className="mt-1 text-[18px] text-[#efe6d8]"
                    style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                  >
                    {typeof extracted.cyclePosition === "number"
                      ? `${degNorm(extracted.cyclePosition).toFixed(2)}°`
                      : "—"}
                  </div>
                  <div className="mt-2 text-[11px] text-[#8f7f6a]">
                    Degrees from natal ASC through the yearly cycle.
                  </div>
                </div>

                <div className="rounded-xl border border-[#2a241d] bg-[#0b0906] p-4">
                  <div className="text-[11px] text-[#b9a88f]">Current Boundary</div>
                  <div
                    className="mt-1 text-[18px] text-[#efe6d8]"
                    style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                  >
                    {typeof extracted.segmentStart === "number" &&
                    typeof extracted.segmentEnd === "number"
                      ? `${degNorm(extracted.segmentStart).toFixed(0)}° → ${degNorm(
                          extracted.segmentEnd
                        ).toFixed(0)}°`
                      : "—"}
                  </div>
                  <div className="mt-2 text-[11px] text-[#8f7f6a]">
                    30° segment boundaries (if provided by API).
                  </div>
                </div>

                <div className="rounded-xl border border-[#2a241d] bg-[#0b0906] p-4">
                  <div className="text-[11px] text-[#b9a88f]">Natal ASC (anchor)</div>
                  <div
                    className="mt-1 text-[18px] text-[#efe6d8]"
                    style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                  >
                    {typeof extracted.natalASC === "number"
                      ? `${degNorm(extracted.natalASC).toFixed(2)}°`
                      : "—"}
                  </div>
                  <div className="mt-2 text-[11px] text-[#8f7f6a]">
                    The fixed reference point for the cycle.
                  </div>
                </div>

                <div className="rounded-xl border border-[#2a241d] bg-[#0b0906] p-4">
                  <div className="text-[11px] text-[#b9a88f]">Transiting Sun (mover)</div>
                  <div
                    className="mt-1 text-[18px] text-[#efe6d8]"
                    style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                  >
                    {typeof extracted.transitingSun === "number"
                      ? `${degNorm(extracted.transitingSun).toFixed(2)}°`
                      : "—"}
                  </div>
                  <div className="mt-2 text-[11px] text-[#8f7f6a]">
                    Sun longitude used to move the cycle.
                  </div>
                </div>
              </div>

              <details className="mt-5">
                <summary className="text-[12px] text-[#b9a88f] cursor-pointer select-none">
                  Raw response (debug)
                </summary>
                <pre
                  className="mt-3 rounded-xl border border-[#2a241d] bg-[#0b0906] p-4 text-[12px] leading-5 whitespace-pre-wrap break-words text-[#d9cfbf]"
                  style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}
                >
                  {ascData ? safeJsonStringify(ascData) : rawOut || "No data yet."}
                </pre>
              </details>
            </div>
          </div>
        </div>

        {/* Footer tone */}
        <div className="text-[11px] text-[#8f7f6a] px-1">
          /seasons is a presentation layer over /api/asc-year. Once this is stable,
          we can add interpretation copy and a “what to do this season” block.
        </div>
      </div>
    </div>
  );
}
