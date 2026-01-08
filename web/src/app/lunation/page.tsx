// src/app/lunation/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AstroInputForm, { type AstroPayloadText } from "@/components/astro/AstroInputForm";
import { NAV, NavPill } from "@/lib/ui/nav";

const LS_PAYLOAD_KEY = "ura:lastPayloadText";

// -----------------------------
// Types (Lunation Wrapper API)
// /api/lunation returns: { ok, text, summary, lunation, input }
// -----------------------------

type CoreSummary = {
  ascYearLabel?: string;
  ascYearCyclePos?: number;
  ascYearDegreesInto?: number;

  lunationLabel?: string;
  lunationSeparation?: number;

  natal?: { asc?: number; ascSign?: string; mc?: number; mcSign?: string };
  asOf?: { sun?: number; sunSign?: string };
};

type CoreLunation = {
  progressedDateUTC?: string;
  progressedSunLon?: number;
  progressedMoonLon?: number;
  separation?: number;
  phase?: string;
  subPhase?: { label?: string; segment?: number; total?: number; within?: number };
  boundaries?: Array<{ deg?: number; label?: string; dateUTC?: string }>;
  nextNewMoonUTC?: string;
};

type LunationResponse = {
  ok: boolean;
  error?: string;
  text?: string;
  summary?: CoreSummary | null;
  lunation?: CoreLunation | null;
  input?: any;
  core?: any;
};

// -----------------------------
// Utility
// -----------------------------

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function degNorm(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

function pretty(x: any) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function fmtYMD(isoOrDate: any) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(String(isoOrDate));
  if (Number.isNaN(d.getTime())) return String(isoOrDate ?? "");
  return d.toISOString().slice(0, 10);
}

function fmtYMDHM(isoOrDate: any) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(String(isoOrDate));
  if (Number.isNaN(d.getTime())) return String(isoOrDate ?? "");
  return d.toISOString().slice(0, 16).replace("T", " ");
}

async function postText(endpoint: string, text: string) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: text,
    cache: "no-store",
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

/**
 * Best-effort parse of the canonical payload text into initial form fields.
 */
type AstroFormInitial = {
  birthDate?: string;
  birthTime?: string;
  timeZone?: string;
  birthCityState?: string;
  lat?: number;
  lon?: number;
  asOfDate?: string;
  resolvedLabel?: string;
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

// -----------------------------
// Zodiac formatting
// -----------------------------

const SIGN_NAMES = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const SIGN_GLYPHS: Record<(typeof SIGN_NAMES)[number], string> = {
  Aries: "♈︎",
  Taurus: "♉︎",
  Gemini: "♊︎",
  Cancer: "♋︎",
  Leo: "♌︎",
  Virgo: "♍︎",
  Libra: "♎︎",
  Scorpio: "♏︎",
  Sagittarius: "♐︎",
  Capricorn: "♑︎",
  Aquarius: "♒︎",
  Pisces: "♓︎",
};

function lonToSignParts(lon: number) {
  const x = degNorm(lon);
  const signIndex = Math.floor(x / 30);
  const sign = SIGN_NAMES[signIndex] ?? "Aries";
  const within = x - signIndex * 30;
  const deg = Math.floor(within);
  const min = Math.round((within - deg) * 60);
  const minFixed = min === 60 ? 0 : min;
  const degFixed = min === 60 ? deg + 1 : deg;
  return { sign, deg: degFixed, min: minFixed };
}

function fmtSignLon(lon: number) {
  const p = lonToSignParts(lon);
  const glyph = SIGN_GLYPHS[p.sign] ?? "";
  const mm = String(p.min).padStart(2, "0");
  return {
    glyph,
    sign: p.sign,
    text: `${glyph} ${p.deg}°${mm}′`,
    raw: `${degNorm(lon).toFixed(2)}°`,
  };
}

// -----------------------------
// Moonstone theme
// -----------------------------

function moonstoneTheme() {
  return {
    pageBg: "bg-black",
    shellBorder: "border-[#d9d4ca]",
    shellBg: "bg-gradient-to-b from-[#fbfaf7] to-[#ece7de]",
    shellSub: "text-[#3a3a44]",
    shellMuted: "text-[#6b6b76]",
    chipBg: "bg-[#d6d2cb]",
    chipGlow: "shadow-[0_0_26px_rgba(210,205,198,0.55)]",
    accent: "text-[#23232a]",
    ring: "#bfb9b1",
    panelBg: "bg-[#fbfaf7]",
    panelBorder: "border-[#d9d4ca]",
    panelMono: { fontFamily: "Menlo, Monaco, Consolas, monospace" as const },
    dangerBg: "bg-[#fff2f2]",
    dangerBorder: "border-[#e4bcbc]",
    dangerText: "text-[#4a1f1f]",
  };
}

// -----------------------------
// UI pieces
// -----------------------------

function MoonDial({ separationDeg, ringColor }: { separationDeg: number | null; ringColor: string }) {
  const cx = 90;
  const cy = 90;
  const r = 68;

  const sep = typeof separationDeg === "number" ? degNorm(separationDeg) : 0;
  const angle = -90 + sep; // 0° at top, clockwise
  const rad = (Math.PI / 180) * angle;

  const x2 = cx + r * Math.cos(rad);
  const y2 = cy + r * Math.sin(rad);

  return (
    <div className="rounded-2xl border border-[#d9d4ca] bg-[#fbfaf7] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] tracking-[0.18em] text-[#6b6b76] uppercase">Lunation dial</div>
        <div className="text-[12px] text-[#3a3a44]" style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}>
          {typeof separationDeg === "number" ? `${sep.toFixed(2)}°` : "—"}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <svg width="180" height="180" viewBox="-20 -20 220 220">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e6e1d8" strokeWidth="12" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={ringColor} strokeWidth="12" strokeDasharray="2 12" opacity="0.5" />

          <line x1={cx} y1={cy - r - 8} x2={cx} y2={cy + r + 8} stroke="#d9d4ca" strokeWidth="1" opacity="0.9" />
          <line x1={cx - r - 8} y1={cy} x2={cx + r + 8} y2={cy} stroke="#d9d4ca" strokeWidth="1" opacity="0.9" />

          <text x={cx} y={cy - r - 8} textAnchor="middle" dominantBaseline="hanging" fontSize="10" fill="#6b6b76" letterSpacing="2">
            NEW
          </text>
          <text x={cx + r + 12} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#6b6b76" letterSpacing="2">
            1Q
          </text>
          <text x={cx} y={cy + r + 18} textAnchor="middle" dominantBaseline="alphabetic" fontSize="10" fill="#6b6b76" letterSpacing="2">
            FULL
          </text>
          <text x={cx - r - 12} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#6b6b76" letterSpacing="2">
            3Q
          </text>

          <circle cx={cx} cy={cy} r="3.5" fill={ringColor} />
          <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={ringColor} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx={x2} cy={y2} r="3" fill={ringColor} opacity="0.95" />
        </svg>
      </div>

      <div className="mt-3 text-[11px] text-[#6b6b76]">0° = New Moon separation. The hand tracks Sun–Moon separation (0–360).</div>
    </div>
  );
}

function Meter({ value01, label, note }: { value01: number; label: string; note: string }) {
  const pct = Math.round(clamp01(value01) * 100);
  return (
    <div className="rounded-2xl border border-[#d9d4ca] bg-[#fbfaf7] p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] tracking-[0.18em] text-[#6b6b76] uppercase">{label}</div>
        <div className="text-[12px] text-[#3a3a44]" style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}>
          {pct}%
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-[#ece7de] overflow-hidden">
        <div className="h-2 rounded-full bg-[#bfb9b1]" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 text-[11px] text-[#6b6b76]">{note}</div>
    </div>
  );
}

function MiniCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-[#d9d4ca] bg-[#f3efe7] p-4">
      <div className="text-[11px] text-[#6b6b76]">{label}</div>
      <div className="mt-1 text-[18px] text-[#0f0f12]" style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}>
        {value}
      </div>
      <div className="mt-2 text-[11px] text-[#6b6b76]">{note}</div>
    </div>
  );
}

function BoundariesList({
  boundaries,
  nextNewMoonUTC,
}: {
  boundaries: Array<{ deg?: number; label?: string; dateUTC?: string }>;
  nextNewMoonUTC?: string;
}) {
  const items = Array.isArray(boundaries) ? boundaries : [];
  return (
    <div className="rounded-xl border border-[#d9d4ca] bg-[#f3efe7] p-4">
      <div className="text-[11px] text-[#6b6b76] mb-3">Current cycle boundaries (approx dates when separation hits the boundary).</div>

      <div className="grid grid-cols-1 gap-2">
        {items.length ? (
          items.map((b, idx) => {
            const label = b?.label ?? `Boundary ${idx + 1}`;
            const deg = typeof b?.deg === "number" ? `${b.deg}°` : "—";
            const date = b?.dateUTC ? fmtYMD(b.dateUTC) : "—";
            return (
              <div
                key={`${label}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-[#e3ded5] bg-[#fbfaf7] px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="text-[12px] text-[#6b6b76] w-[86px]">{deg}</div>
                  <div className="text-[12px] text-[#23232a]">{label}</div>
                </div>
                <div className="text-[12px] text-[#3a3a44]" style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}>
                  {date}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-[12px] text-[#6b6b76]">—</div>
        )}

        {nextNewMoonUTC ? (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-[#e3ded5] bg-[#fbfaf7] px-3 py-2">
            <div className="text-[12px] text-[#23232a]">Next New Moon (360°)</div>
            <div className="text-[12px] text-[#3a3a44]" style={{ fontFamily: "Menlo, Monaco, Consolas, monospace" }}>
              {fmtYMD(nextNewMoonUTC)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// -----------------------------
// Page
// -----------------------------

export default function LunationPage() {
  const theme = useMemo(() => moonstoneTheme(), []);

  const [payloadOut, setPayloadOut] = useState<string>("");
  const [api, setApi] = useState<LunationResponse | null>(null);
  const [errorOut, setErrorOut] = useState<string>("");
  const [statusLine, setStatusLine] = useState<string>("");

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

  const initialFromSaved = useMemo<AstroFormInitial>(() => {
    if (!savedPayload) return {};
    return safeParsePayloadTextToInitial(savedPayload);
  }, [savedPayload]);

  const summary = api?.summary ?? null;
  const lun = api?.lunation ?? null;

  const lunationLabel = summary?.lunationLabel ?? lun?.phase ?? null;

  const separation =
    typeof summary?.lunationSeparation === "number"
      ? summary.lunationSeparation
      : typeof lun?.separation === "number"
        ? lun.separation
        : null;

  const progressedDateUTC = lun?.progressedDateUTC ?? null;
  const progressedSunLon = typeof lun?.progressedSunLon === "number" ? lun.progressedSunLon : null;
  const progressedMoonLon = typeof lun?.progressedMoonLon === "number" ? lun.progressedMoonLon : null;

  const sub = lun?.subPhase ?? null;
  const subLabel = sub?.label ?? null;
  const subWithin = typeof sub?.within === "number" ? sub.within : null;

  const phaseProgress01 = useMemo(() => {
    if (typeof separation !== "number") return 0;
    const within45 = degNorm(separation) % 45;
    return clamp01(within45 / 45);
  }, [separation]);

  const subProgress01 = useMemo(() => {
    if (typeof subWithin !== "number") return 0;
    return clamp01(subWithin / 15);
  }, [subWithin]);

  async function handleGenerate(payloadText: AstroPayloadText) {
    setPayloadOut(payloadText);

    try {
      window.localStorage.setItem(LS_PAYLOAD_KEY, payloadText);
      setSavedPayload(payloadText);
    } catch {
      // ignore
    }

    setApi(null);
    setErrorOut("");
    setStatusLine("Computing lunation…");

    const out = await postText("/api/lunation", payloadText);

    if (!out.res.ok || out.data?.ok === false) {
      setStatusLine("");
      setErrorOut(
        `ERROR\n${pretty({
          status: out.res.status,
          error: out.data?.error ?? "Unknown error",
          response: out.data,
        })}`
      );
      return;
    }

    setApi(out.data as LunationResponse);
    setStatusLine("");
  }

  return (
    <div className={`min-h-[100svh] ${theme.pageBg} flex items-center justify-center p-6`}>
      <div className="w-full max-w-6xl space-y-5">
        {/* Header */}
        <div className={`rounded-2xl border ${theme.shellBorder} ${theme.shellBg} p-6`}>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="text-[12px] tracking-[0.18em] text-[#6b6b76] uppercase">URA • Lunation</div>

              <div className={`mt-2 text-[34px] leading-[1.05] font-semibold ${theme.accent}`}>
                {lunationLabel ?? "—"}
                {subLabel ? <span className={`font-normal ${theme.shellMuted}`}> • {subLabel}</span> : null}
              </div>

              <div className={`mt-2 text-[13px] ${theme.shellSub} max-w-xl`}>
                Progressed lunation (Sun–Moon separation) — rendered from{" "}
                <span style={theme.panelMono}>/api/lunation</span> (wraps <span style={theme.panelMono}>/api/core</span>).
              </div>

              {/* ✅ APP NAV BAR (home access included) */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {NAV.map((n) => (
                  <NavPill key={n.href} href={n.href} label={n.label} active={n.href === "/lunation"} />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="rounded-xl border border-[#d9d4ca] bg-white/50 px-4 py-2 text-[12px] text-[#23232a] hover:bg-white/70"
                >
                  Home
                </Link>

                <Link
                  href="/input"
                  className="rounded-xl border border-[#d9d4ca] bg-white/40 px-4 py-2 text-[12px] text-[#23232a] hover:bg-white/60"
                >
                  Edit input
                </Link>

                <Link
                  href="/seasons"
                  className="rounded-xl border border-[#d9d4ca] bg-white/40 px-4 py-2 text-[12px] text-[#23232a] hover:bg-white/60"
                >
                  Go to /seasons
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${theme.chipBg} ${theme.chipGlow}`} />
                <div className="text-[12px] text-[#6b6b76]">Moonstone palette</div>
              </div>
            </div>
          </div>

          {statusLine ? <div className="mt-4 text-[12px] text-[#3a3a44]">{statusLine}</div> : null}
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: input + payload + error */}
          <div className="space-y-5">
            <AstroInputForm
              title="URA • Input"
              defaultAsOfToToday
              initial={{
                birthDate: initialFromSaved.birthDate ?? "1990-01-24",
                birthTime: initialFromSaved.birthTime ?? "01:39",
                timeZone: initialFromSaved.timeZone ?? "America/New_York",
                birthCityState: initialFromSaved.birthCityState ?? "Danville, VA",
                lat: typeof initialFromSaved.lat === "number" ? initialFromSaved.lat : 36.585,
                lon: typeof initialFromSaved.lon === "number" ? initialFromSaved.lon : -79.395,
                asOfDate: initialFromSaved.asOfDate,
                resolvedLabel: initialFromSaved.resolvedLabel,
              }}
              onGenerate={handleGenerate}
            />

            <div className={`rounded-2xl border ${theme.panelBorder} ${theme.panelBg} p-4`}>
              <div className="text-[12px] text-[#6b6b76] mb-2">Payload (text/plain)</div>
              <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-[#23232a]" style={theme.panelMono}>
                {payloadOut || "Generate to view the request payload."}
              </pre>
            </div>

            {errorOut ? (
              <div className={`rounded-2xl border ${theme.dangerBorder} ${theme.dangerBg} p-4`}>
                <div className={`text-[12px] ${theme.dangerText} mb-2`}>Error</div>
                <pre className={`text-[12px] leading-5 whitespace-pre-wrap break-words ${theme.dangerText}`} style={theme.panelMono}>
                  {errorOut}
                </pre>
              </div>
            ) : null}
          </div>

          {/* Right: lunation panels */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <MoonDial separationDeg={separation} ringColor={theme.ring} />
              <Meter value01={phaseProgress01} label="Phase progress" note="Progress through the current 45° phase boundary (visual meter)." />
            </div>

            <div className={`rounded-2xl border ${theme.panelBorder} ${theme.panelBg} p-6`}>
              <div className="text-[12px] tracking-[0.18em] text-[#6b6b76] uppercase">Details</div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <MiniCard label="Separation" value={typeof separation === "number" ? `${degNorm(separation).toFixed(2)}°` : "—"} note="Sun–Moon angular distance." />
                <MiniCard label="Progressed date (UTC)" value={progressedDateUTC ? fmtYMDHM(progressedDateUTC) : "—"} note="Secondary progression date used to compute the phase." />
                <MiniCard
                  label="Progressed Sun"
                  value={typeof progressedSunLon === "number" ? `${fmtSignLon(progressedSunLon).text}` : "—"}
                  note={typeof progressedSunLon === "number" ? `Raw ${fmtSignLon(progressedSunLon).raw}` : "Zodiac placement of progressed Sun."}
                />
                <MiniCard
                  label="Progressed Moon"
                  value={typeof progressedMoonLon === "number" ? `${fmtSignLon(progressedMoonLon).text}` : "—"}
                  note={typeof progressedMoonLon === "number" ? `Raw ${fmtSignLon(progressedMoonLon).raw}` : "Zodiac placement of progressed Moon."}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <Meter value01={subProgress01} label="Sub-phase" note={subLabel ? `Within “${subLabel}” (visual meter).` : "Sub-phase meter (uses subPhase.within if available)."} />

                <div className="rounded-2xl border border-[#d9d4ca] bg-[#fbfaf7] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[12px] tracking-[0.18em] text-[#6b6b76] uppercase">Snapshot</div>
                    <div className="text-[12px] text-[#3a3a44]" style={theme.panelMono}>
                      {summary?.lunationLabel ?? lun?.phase ?? "—"}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#6b6b76]">
                    This panel is intentionally “human-readable” — the raw JSON stays in the API.
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <div className="text-[12px] tracking-[0.18em] text-[#6b6b76] uppercase">Cycle boundaries</div>
                <div className="mt-3">
                  <BoundariesList boundaries={Array.isArray(lun?.boundaries) ? lun!.boundaries! : []} nextNewMoonUTC={lun?.nextNewMoonUTC} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-[#a9a3a0] px-1">
          /lunation is a presentation layer over <span className="text-[#e9e6e1]">/api/lunation</span> (wraps{" "}
          <span className="text-[#e9e6e1]">/api/core</span>). Saved payload key:{" "}
          <span className="text-[#e9e6e1]">{LS_PAYLOAD_KEY}</span>
        </div>
      </div>
    </div>
  );
}
