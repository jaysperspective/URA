// src/app/seasons/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import URAFoundationCard from "@/components/ura/URAFoundationCard";

/**
 * Seasons Page (Client)
 * - Preserves your existing “Asc-Year season/modality” worldview (Spring/Summer/Fall/Winter, etc.)
 * - Adds URA Foundation layer (Solar 8-phase → Orisha modality → Planet force overlay)
 * - Does NOT rename any existing labels
 *
 * NOTE:
 * This page expects your existing /api/asc-year route to be callable.
 * If your /seasons page previously used a different endpoint/payload, swap the payload builder below
 * to match what you already do. The URA Foundation layer is independent and safe.
 */

type UraContext = {
  ok: boolean;
  asOfUTC?: string;
  astro?: { sunLon: number; moonLon: number };
  solar?: {
    phaseId: number;
    phaseIndex0: number;
    degIntoPhase: number;
    progress01: number;
    startDeg: number;
    endDeg: number;
  };
  ontology?: any;
};

type AscYearResponse = {
  ok: boolean;
  ascYear?: {
    natalAscLon?: number | null;
    transitingSunLon?: number | null;
    cyclePosition?: number | null;

    phaseIndex?: number; // 0..7
    phaseLabel?: string; // P1..P8
    phaseDegInto?: number;
    phaseProgress01?: number;

    nextPhaseLabel?: string;
    nextPhaseBoundaryLon?: number;
    daysUntilNextPhase?: number;

    season?: string; // Spring/Summer/Fall/Winter
    seasonDegInto?: number;
    seasonProgress01?: number;
  };
  error?: string;
};

function safeNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fmtDeg(n: number | null | undefined, digits = 2) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}°`;
}

function pct(n: number | null | undefined) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}

export default function SeasonsPage() {
  const [uraCtx, setUraCtx] = useState<UraContext | null>(null);
  const [asc, setAsc] = useState<AscYearResponse | null>(null);
  const [loadingAsc, setLoadingAsc] = useState(false);

  // ---- If your /seasons previously used user profile data:
  // Replace this with your existing payload builder / form / stored profile.
  // This default payload is a safe placeholder; your /api/asc-year route will likely require real birth data.
  const defaultPayload = useMemo(() => {
    // ✅ Keep this structure compatible with ensureProfileCaches payload (birth + lat/lon + timezone)
    // You should replace these with your actual stored profile inputs or your existing form state.
    return {
      year: 1990,
      month: 1,
      day: 24,
      hour: 1,
      minute: 39,
      lat: 36.585,
      lon: -79.395,
      latitude: 36.585,
      longitude: -79.395,
      timezone: "America/New_York",
    };
  }, []);

  // 1) URA Foundation Layer — does NOT depend on asc-year; safe to fetch always
  useEffect(() => {
    fetch("/api/ura/context", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setUraCtx(j?.ok ? j : null))
      .catch(() => setUraCtx(null));
  }, []);

  // 2) Asc-Year Layer (your existing seasons logic)
  useEffect(() => {
    let alive = true;

    async function run() {
      setLoadingAsc(true);
      try {
        const r = await fetch("/api/asc-year", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(defaultPayload),
          cache: "no-store",
        });
        const j = (await r.json().catch(() => null)) as AscYearResponse | null;
        if (!alive) return;
        setAsc(j ?? null);
      } catch (e) {
        if (!alive) return;
        setAsc({ ok: false, error: "Failed to fetch /api/asc-year" });
      } finally {
        if (!alive) return;
        setLoadingAsc(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [defaultPayload]);

  const ascYear = asc?.ascYear ?? null;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.95) 0%, rgba(185,176,123,0.55) 55%, rgba(113,116,79,0.45) 120%)",
      }}
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div
            className="text-[11px] tracking-[0.18em] uppercase"
            style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}
          >
            URA • Seasons
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm hover:opacity-95"
              style={{
                borderColor: "rgba(31,36,26,0.16)",
                background: "rgba(244,235,221,0.78)",
                color: "#1F241A",
              }}
            >
              Profile
            </Link>

            <Link
              href="/calendar"
              className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm hover:opacity-95"
              style={{
                borderColor: "rgba(31,36,26,0.16)",
                background: "rgba(244,235,221,0.78)",
                color: "#1F241A",
              }}
            >
              Calendar
            </Link>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Primary: Your existing “Orientation” block (Asc-Year) */}
          <div className="lg:col-span-2 rounded-3xl border p-6"
               style={{ borderColor: "rgba(31,36,26,0.16)", background: "rgba(244,235,221,0.88)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-[11px] tracking-[0.18em] uppercase"
                  style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}
                >
                  Orientation
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "#1F241A" }}>
                  Asc-Year Season Arc
                </div>
                <div className="mt-2 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
                  This module preserves your existing season model (Spring/Summer/Fall/Winter) and phase progression.
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px]" style={{ color: "rgba(31,36,26,0.55)" }}>
                  Status
                </div>
                <div className="mt-1 text-sm" style={{ color: "#1F241A" }}>
                  {loadingAsc ? "Refreshing…" : asc?.ok ? "Live" : "Unavailable"}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4"
                   style={{ borderColor: "rgba(31,36,26,0.12)", background: "rgba(244,235,221,0.72)" }}>
                <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
                  Current Season
                </div>
                <div className="mt-2 text-xl font-semibold" style={{ color: "#1F241A" }}>
                  {ascYear?.season ?? "—"}
                </div>
                <div className="mt-2 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
                  Progress: {pct(safeNum(ascYear?.seasonProgress01))}
                </div>
              </div>

              <div className="rounded-2xl border p-4"
                   style={{ borderColor: "rgba(31,36,26,0.12)", background: "rgba(244,235,221,0.72)" }}>
                <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
                  8-Phase Position
                </div>
                <div className="mt-2 text-xl font-semibold" style={{ color: "#1F241A" }}>
                  {ascYear?.phaseLabel ?? "—"}
                </div>
                <div className="mt-2 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
                  Into phase: {fmtDeg(safeNum(ascYear?.phaseDegInto), 2)} • {pct(safeNum(ascYear?.phaseProgress01))}
                </div>
              </div>

              <div className="rounded-2xl border p-4 md:col-span-2"
                   style={{ borderColor: "rgba(31,36,26,0.12)", background: "rgba(244,235,221,0.72)" }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
                      Next Boundary
                    </div>
                    <div className="mt-2 text-sm" style={{ color: "#1F241A" }}>
                      Next phase: <span className="font-semibold">{ascYear?.nextPhaseLabel ?? "—"}</span>
                      {" • "}
                      Boundary lon: <span className="font-semibold">{fmtDeg(safeNum(ascYear?.nextPhaseBoundaryLon), 2)}</span>
                    </div>
                  </div>

                  <div className="text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
                    ETA:{" "}
                    <span className="font-semibold" style={{ color: "#1F241A" }}>
                      {typeof ascYear?.daysUntilNextPhase === "number"
                        ? `${ascYear.daysUntilNextPhase.toFixed(1)} days`
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Simple progress bar (keeps labels intact) */}
                <div className="mt-4 h-2 w-full rounded-full" style={{ background: "rgba(31,36,26,0.12)" }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, (safeNum(ascYear?.seasonProgress01) ?? 0) * 100))}%`,
                      background: "rgba(31,36,26,0.55)",
                    }}
                  />
                </div>

                {!asc?.ok && asc?.error ? (
                  <div className="mt-4 text-xs" style={{ color: "rgba(31,36,26,0.55)" }}>
                    {asc.error}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right / Foundation: Solar 8-Phase + Orisha + Planet Overlay */}
          <div className="lg:col-span-1">
            <URAFoundationCard
              phaseId={uraCtx?.solar?.phaseId ?? null}
              progress01={uraCtx?.solar?.progress01 ?? null}
              ontology={uraCtx?.ontology ?? null}
            />
            <div className="mt-4 rounded-2xl border p-4"
                 style={{ borderColor: "rgba(31,36,26,0.16)", background: "rgba(244,235,221,0.78)" }}>
              <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
                Solar (Degree-True)
              </div>
              <div className="mt-2 text-sm" style={{ color: "#1F241A" }}>
                Sun: <span className="font-semibold">{fmtDeg(safeNum(uraCtx?.astro?.sunLon), 2)}</span>
                {" • "}
                Moon: <span className="font-semibold">{fmtDeg(safeNum(uraCtx?.astro?.moonLon), 2)}</span>
              </div>
              <div className="mt-2 text-xs" style={{ color: "rgba(31,36,26,0.55)" }}>
                Source of truth for the URA Solar Phase (8 × 45°). Labels remain unchanged.
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-10 text-xs" style={{ color: "rgba(31,36,26,0.55)" }}>
          Tip: Replace the placeholder birth payload in this page with your user’s stored profile inputs (or the same payload you use in your existing seasons build).
        </div>
      </div>
    </div>
  );
}

