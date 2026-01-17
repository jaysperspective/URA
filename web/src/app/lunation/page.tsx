// src/app/lunation/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

const LS_PAYLOAD_KEY = "ura:lastPayloadText";

// -----------------------------
// Types
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

function fmtYMD(isoOrDate: any) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(String(isoOrDate));
  if (Number.isNaN(d.getTime())) return String(isoOrDate ?? "");
  return d.toISOString().slice(0, 10);
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


// -----------------------------
// Zodiac formatting
// -----------------------------

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

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
  return `${p.deg}° ${p.sign}`;
}

// -----------------------------
// UI Components
// -----------------------------

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ura-card p-6 md:p-7 ${className}`}>
      {children}
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ura-panel px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

function LunationDial({ separationDeg }: { separationDeg: number | null }) {
  const cx = 100;
  const cy = 100;
  const r = 75;

  const sep = typeof separationDeg === "number" ? degNorm(separationDeg) : 0;
  const angle = -90 + sep;
  const rad = (Math.PI / 180) * angle;

  const x2 = cx + r * Math.cos(rad);
  const y2 = cy + r * Math.sin(rad);

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ura-border-subtle)" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ura-text-muted)" strokeWidth="14" strokeDasharray="2 14" opacity="0.3" />

        {/* Cross lines */}
        <line x1={cx} y1={cx - r - 6} x2={cx} y2={cx + r + 6} stroke="var(--ura-border-subtle)" strokeWidth="1" />
        <line x1={cx - r - 6} y1={cy} x2={cx + r + 6} y2={cy} stroke="var(--ura-border-subtle)" strokeWidth="1" />

        {/* Labels */}
        <text x={cx} y={cy - r - 12} textAnchor="middle" fontSize="9" fill="var(--ura-text-muted)" letterSpacing="1.5">NEW</text>
        <text x={cx + r + 14} y={cy + 3} textAnchor="middle" fontSize="9" fill="var(--ura-text-muted)" letterSpacing="1.5">1Q</text>
        <text x={cx} y={cy + r + 18} textAnchor="middle" fontSize="9" fill="var(--ura-text-muted)" letterSpacing="1.5">FULL</text>
        <text x={cx - r - 14} y={cy + 3} textAnchor="middle" fontSize="9" fill="var(--ura-text-muted)" letterSpacing="1.5">3Q</text>

        {/* Hand */}
        {typeof separationDeg === "number" && (
          <>
            <circle cx={cx} cy={cy} r="4" fill="var(--ura-accent-primary)" />
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="var(--ura-accent-primary)" strokeWidth="3" strokeLinecap="round" />
            <circle cx={x2} cy={y2} r="4" fill="var(--ura-accent-primary)" />
          </>
        )}
      </svg>
      <div className="text-sm mt-2 ura-text-secondary">
        {typeof separationDeg === "number" ? `${sep.toFixed(1)}° separation` : "No data"}
      </div>
    </div>
  );
}

function ProgressBar({ value01, label }: { value01: number; label: string }) {
  const pct = Math.round(clamp01(value01) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs ura-text-muted">{label}</div>
        <div className="text-xs font-medium ura-text-secondary">{pct}%</div>
      </div>
      <div className="ura-progress-track">
        <div className="ura-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--ura-border-subtle)" }}>
      <span className="text-sm ura-text-muted">{label}</span>
      <span className="text-sm font-medium ura-text-primary">{value}</span>
    </div>
  );
}

// -----------------------------
// Page
// -----------------------------

export default function LunationPage() {
  const [payloadText, setPayloadText] = useState<string>("");
  const [api, setApi] = useState<LunationResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load saved natal payload from localStorage (previously saved from profile)
  useEffect(() => {
    try {
      const x = window.localStorage.getItem(LS_PAYLOAD_KEY) || "";
      if (x) setPayloadText(x);
    } catch {
      // ignore
    }
  }, []);

  async function generateLunation() {
    if (!payloadText.trim()) {
      setError("No natal data found. Please set up your profile first to calculate your lunation.");
      return;
    }

    setLoading(true);
    setError("");
    setApi(null);

    const out = await postText("/api/lunation", payloadText);

    if (!out.res.ok || out.data?.ok === false) {
      setError(out.data?.error ?? `Request failed (${out.res.status})`);
      setLoading(false);
      return;
    }

    setApi(out.data as LunationResponse);
    setLoading(false);
  }

  const summary = api?.summary ?? null;
  const lun = api?.lunation ?? null;

  const lunationLabel = summary?.lunationLabel ?? lun?.phase ?? null;
  const separation = typeof summary?.lunationSeparation === "number"
    ? summary.lunationSeparation
    : typeof lun?.separation === "number"
      ? lun.separation
      : null;

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

  const hasNatalData = payloadText.trim().length > 0;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5">
          <div className="ura-section-label">URA</div>
          <div className="ura-page-title mt-1">Lunation</div>
        </div>

        {/* Section: Secondary Lunation */}
        <Card>
          <div className="ura-section-label">The Progressed Lunation Cycle</div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight ura-text-primary">
            Understanding Your Inner Seasons
          </h2>

          <div className="mt-4 space-y-3 text-sm ura-text-secondary leading-relaxed">
            <p>
              The Progressed Lunation Cycle tracks the relationship between your progressed Sun and
              progressed Moon over a roughly 29-30 year period. This cycle mirrors the familiar
              lunar phases we see in the sky each month, but unfolds across decades of your life.
            </p>

            <p>
              Using secondary progressions (where one day after birth equals one year of life),
              URA calculates the angular separation between your progressed Sun and Moon. This
              separation moves through the same eight phases as the monthly lunar cycle: New Moon,
              Crescent, First Quarter, Gibbous, Full Moon, Disseminating, Last Quarter, and Balsamic.
            </p>

            <p>
              Each phase represents a distinct quality of inner development. The cycle does not
              predict events. It orients you to your current developmental season, revealing
              what mode of engagement is most appropriate for where you are in your personal
              evolution.
            </p>
          </div>

          {/* Phase descriptions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Panel>
              <div className="text-xs font-semibold mb-1 ura-text-primary">
                Waxing Phases (0°-180°)
              </div>
              <div className="text-xs ura-text-muted">
                Building, growing, establishing. Energy moves outward. New structures take form.
              </div>
            </Panel>
            <Panel>
              <div className="text-xs font-semibold mb-1 ura-text-primary">
                Waning Phases (180°-360°)
              </div>
              <div className="text-xs ura-text-muted">
                Sharing, releasing, integrating. Energy turns inward. Meaning is extracted from experience.
              </div>
            </Panel>
          </div>

          {/* Generate Button */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--ura-border-subtle)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-sm font-medium ura-text-primary">
                  Calculate Your Progressed Lunation
                </div>
                <div className="text-xs mt-1 ura-text-muted">
                  {hasNatalData
                    ? "Ready to calculate based on your saved profile data."
                    : "No natal data found. Set up your profile first."}
                </div>
              </div>

              <button
                onClick={generateLunation}
                disabled={loading || !hasNatalData}
                className={hasNatalData ? "ura-btn-primary" : "ura-btn-secondary"}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: "var(--ura-border-subtle)", borderTopColor: "var(--ura-text-primary)" }}
                    />
                    Calculating...
                  </span>
                ) : (
                  "Generate Lunation"
                )}
              </button>
            </div>

            {error && (
              <div className="ura-alert mt-4">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          {api && (
            <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--ura-border-subtle)" }}>
              <div className="ura-section-label">Your Current Lunation</div>

              {/* Phase headline */}
              <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="text-3xl font-semibold tracking-tight ura-text-accent">
                    {lunationLabel ?? "-"}
                  </div>
                  {subLabel && (
                    <div className="mt-1 text-lg ura-text-secondary">
                      {subLabel}
                    </div>
                  )}
                </div>

                <LunationDial separationDeg={separation} />
              </div>

              {/* Progress bars */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel>
                  <ProgressBar value01={phaseProgress01} label="Progress through current phase" />
                </Panel>
                {typeof subWithin === "number" && (
                  <Panel>
                    <ProgressBar value01={clamp01(subWithin / 15)} label="Sub-phase progress" />
                  </Panel>
                )}
              </div>

              {/* Details */}
              <div className="mt-6">
                <Panel>
                  <div className="ura-section-label">Progressed Positions</div>
                  <div className="mt-3">
                    <DataRow
                      label="Sun-Moon Separation"
                      value={typeof separation === "number" ? `${degNorm(separation).toFixed(2)}°` : "-"}
                    />
                    <DataRow
                      label="Progressed Sun"
                      value={typeof progressedSunLon === "number" ? fmtSignLon(progressedSunLon) : "-"}
                    />
                    <DataRow
                      label="Progressed Moon"
                      value={typeof progressedMoonLon === "number" ? fmtSignLon(progressedMoonLon) : "-"}
                    />
                    {lun?.progressedDateUTC && (
                      <DataRow
                        label="Progressed Date"
                        value={fmtYMD(lun.progressedDateUTC)}
                      />
                    )}
                  </div>
                </Panel>
              </div>

              {/* Boundaries */}
              {Array.isArray(lun?.boundaries) && lun.boundaries.length > 0 && (
                <div className="mt-4">
                  <Panel>
                    <div className="ura-section-label">Upcoming Phase Boundaries</div>
                    <p className="mt-3 text-xs mb-3 ura-text-muted">
                      Approximate dates when your progressed lunation reaches each boundary.
                    </p>
                    {lun.boundaries.map((b, idx) => (
                      <DataRow
                        key={idx}
                        label={`${b.label ?? `Phase ${idx + 1}`} (${b.deg ?? 0}°)`}
                        value={b.dateUTC ? fmtYMD(b.dateUTC) : "-"}
                      />
                    ))}
                    {lun.nextNewMoonUTC && (
                      <DataRow label="Next New Moon (360°)" value={fmtYMD(lun.nextNewMoonUTC)} />
                    )}
                  </Panel>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs ura-text-muted">
          Progressed Lunation System
        </div>
      </div>
    </div>
  );
}
