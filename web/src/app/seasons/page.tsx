// src/app/seasons/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import URAFoundationPanel from "@/components/ura/URAFoundationPanel";

/**
 * Seasons Page (Client)
 *
 * - Primary purpose: interact with /api/core in a “terminal” style UI
 * - Secondary: show URA Solar 8-phase context (degree-true) via /api/ura/context
 *
 * NOTE: URAFoundationPanel props caused TS errors in build because the component
 * does not declare phaseId/progress01/ontology. We therefore render it without props.
 */

type CoreResponse = {
  ok: boolean;
  text?: string;
  error?: string;
  input?: any;
  derived?: any;
  // older wrappers sometimes return these
  summary?: any;
  lunation?: any;
  ascYear?: any;
};

type UraContext = {
  ok: boolean;
  error?: string;
  asOfUTC?: string;
  astro?: { sunLon: number; moonLon: number };
  solar?: {
    phaseId: number; // 1..8
    phaseIndex0: number; // 0..7
    degIntoPhase: number; // 0..45
    progress01: number; // 0..1
    startDeg: number;
    endDeg: number;
  };
  ontology?: any | null;
};

const LS_KEY = "ura:lastPayloadText";

// --- your dark “terminal” palette ---
const UI = {
  bg: "#0b0906",
  panel: "#0f0d0a",
  border: "#2a241d",
  text: "#efe6d8",
  muted: "#b9a88f",
  subtle: "#8f7f6a",
  accent: "#c2a06f",
};

function todayYMDLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SeasonsPage() {
  const [payloadText, setPayloadText] = useState<string>("");
  const [resultText, setResultText] = useState<string>("");
  const [coreJson, setCoreJson] = useState<CoreResponse | null>(null);

  // URA context (solar 8-phase driver)
  const [uraCtx, setUraCtx] = useState<UraContext | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ---------- init ----------
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LS_KEY);
      if (saved && saved.trim()) setPayloadText(saved);
      else {
        // light default payload
        setPayloadText(
          `birth_datetime: 1990-01-24 01:39
tz_offset: -05:00
lat: 36.585
lon: -79.395
as_of_date: ${todayYMDLocal()}`
        );
      }
    } catch {
      // ignore
    }
  }, []);

  // Save payload on change (so /calendar can read it too if needed)
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, payloadText);
    } catch {
      // ignore
    }
  }, [payloadText]);

  // ---------- actions ----------
  async function runCore() {
    setLoading(true);
    setErr(null);

    try {
      const r = await fetch("/api/core", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: payloadText,
        cache: "no-store",
      });

      const json = (await r.json().catch(async () => {
        const raw = await r.text().catch(() => "");
        return { ok: false, error: "Non-JSON response", raw };
      })) as CoreResponse;

      setCoreJson(json);

      if (!r.ok || json?.ok === false) {
        setResultText(
          `ERROR\n\n${json?.error ?? `core failed (${r.status})`}\n\n` +
            (json ? JSON.stringify(json, null, 2) : "")
        );
        setErr(json?.error ?? "core failed");
      } else {
        // prefer json.text if present, else stringify core
        const text = (json as any)?.text ?? JSON.stringify(json, null, 2);
        setResultText(text);
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      setErr(msg);
      setResultText(`ERROR\n\n${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUraContext() {
    try {
      // We sample “now” unless you want to anchor this to as_of_date.
      // Your /api/ura/context already supports ?asOf=ISO if needed.
      const r = await fetch("/api/ura/context", { cache: "no-store" });
      const j = (await r.json().catch(() => null)) as UraContext | null;
      setUraCtx(j?.ok ? j : null);
    } catch {
      setUraCtx(null);
    }
  }

  useEffect(() => {
    refreshUraContext();
  }, []);

  const uraPhaseLabel = useMemo(() => {
    const pid = uraCtx?.solar?.phaseId;
    return typeof pid === "number" ? `Phase ${pid}` : "—";
  }, [uraCtx?.solar?.phaseId]);

  const uraProgress = useMemo(() => {
    const p = uraCtx?.solar?.progress01;
    if (typeof p !== "number" || !Number.isFinite(p)) return null;
    return Math.max(0, Math.min(1, p));
  }, [uraCtx?.solar?.progress01]);

  return (
    <div className="min-h-[100svh]" style={{ background: UI.bg, color: UI.text }}>
      <div className="mx-auto w-full max-w-6xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] tracking-[0.18em] uppercase" style={{ color: UI.muted }}>
              URA • Seasons
            </div>
            <div className="mt-2 text-[28px] leading-tight font-semibold">
              Core Terminal + Solar Ontology
            </div>
            <div className="mt-1 text-[13px]" style={{ color: UI.subtle }}>
              /api/core (Asc-Year + Lunation) plus /api/ura/context (Solar 8-phase driver)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/calendar"
              className="rounded-xl border px-4 py-2 text-[12px] hover:opacity-95"
              style={{ borderColor: UI.border, background: "rgba(0,0,0,0.18)", color: UI.text }}
            >
              /calendar
            </Link>
            <Link
              href="/profile"
              className="rounded-xl border px-4 py-2 text-[12px] hover:opacity-95"
              style={{ borderColor: UI.border, background: "rgba(0,0,0,0.18)", color: UI.text }}
            >
              /profile
            </Link>
          </div>
        </div>

        {/* Top row: URA context + actions */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5 lg:col-span-2" style={{ borderColor: UI.border, background: UI.panel }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[12px] tracking-[0.18em] uppercase" style={{ color: UI.muted }}>
                  Solar Driver
                </div>
                <div className="mt-2 text-[16px]" style={{ color: UI.text }}>
                  {uraPhaseLabel}
                </div>
                <div className="mt-1 text-[12px]" style={{ color: UI.subtle }}>
                  Degree-true Solar phase via /api/ura/context
                </div>
              </div>

              <div className="min-w-[220px]">
                <div className="text-[11px] mb-2" style={{ color: UI.subtle }}>
                  Progress (0–45°)
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "#1a1510" }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.round((uraProgress ?? 0) * 100)}%`,
                      background: UI.accent,
                    }}
                  />
                </div>

                <div className="mt-2 text-[11px]" style={{ color: UI.subtle }}>
                  {typeof uraCtx?.solar?.degIntoPhase === "number"
                    ? `${uraCtx.solar.degIntoPhase.toFixed(2)}° / 45°`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Foundation Panel (NO PROPS to avoid TS mismatch) */}
            <div className="mt-4">
              <URAFoundationPanel />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={refreshUraContext}
                className="rounded-xl border px-4 py-2 text-[12px] hover:opacity-95"
                style={{ borderColor: UI.border, background: "rgba(0,0,0,0.18)", color: UI.text }}
              >
                Refresh Solar Context
              </button>
              <div className="text-[11px]" style={{ color: UI.subtle }}>
                {uraCtx?.asOfUTC ? `As-of ${uraCtx.asOfUTC.replace(".000Z", "Z")}` : ""}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: UI.border, background: UI.panel }}>
            <div className="text-[12px] tracking-[0.18em] uppercase" style={{ color: UI.muted }}>
              Run core
            </div>
            <div className="mt-2 text-[13px]" style={{ color: UI.subtle }}>
              Posts your payload into <span style={{ color: UI.text }}>/api/core</span>.
            </div>

            <button
              onClick={runCore}
              disabled={loading}
              className="mt-4 w-full rounded-xl border px-4 py-3 text-[13px] hover:opacity-95 disabled:opacity-60"
              style={{ borderColor: UI.border, background: "rgba(0,0,0,0.22)", color: UI.text }}
            >
              {loading ? "Running…" : "Run"}
            </button>

            {err ? (
              <div className="mt-3 text-[12px]" style={{ color: "#e5b3a8" }}>
                {err}
              </div>
            ) : null}

            <div className="mt-4 text-[11px]" style={{ color: UI.subtle }}>
              Tip: Save a clean payload here. /calendar and /profile can reference it.
            </div>
          </div>
        </div>

        {/* Main: payload editor + terminal output */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-5" style={{ borderColor: UI.border, background: UI.panel }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[12px] tracking-[0.18em] uppercase" style={{ color: UI.muted }}>
                  Payload
                </div>
                <div className="mt-1 text-[12px]" style={{ color: UI.subtle }}>
                  text/plain contract (birth + tz + lat/lon + as_of_date)
                </div>
              </div>
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(payloadText);
                  } catch {}
                }}
                className="rounded-xl border px-3 py-2 text-[12px] hover:opacity-95"
                style={{ borderColor: UI.border, background: "rgba(0,0,0,0.18)", color: UI.text }}
              >
                Copy
              </button>
            </div>

            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="mt-4 w-full min-h-[320px] rounded-2xl border p-4 text-[12px] leading-relaxed"
              style={{
                borderColor: UI.border,
                background: "#0b0906",
                color: UI.text,
                fontFamily: "Menlo, Monaco, Consolas, monospace",
              }}
              spellCheck={false}
            />

            <div className="mt-3 text-[11px]" style={{ color: UI.subtle }}>
              Saved locally as <span style={{ color: UI.text }}>{LS_KEY}</span>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: UI.border, background: UI.panel }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[12px] tracking-[0.18em] uppercase" style={{ color: UI.muted }}>
                  Output
                </div>
                <div className="mt-1 text-[12px]" style={{ color: UI.subtle }}>
                  Terminal view of /api/core response
                </div>
              </div>
              <button
                onClick={() => setResultText("")}
                className="rounded-xl border px-3 py-2 text-[12px] hover:opacity-95"
                style={{ borderColor: UI.border, background: "rgba(0,0,0,0.18)", color: UI.text }}
              >
                Clear
              </button>
            </div>

            <pre
              className="mt-4 w-full min-h-[320px] rounded-2xl border p-4 text-[12px] leading-relaxed overflow-auto"
              style={{
                borderColor: UI.border,
                background: "#0b0906",
                color: UI.text,
                fontFamily: "Menlo, Monaco, Consolas, monospace",
              }}
            >
              {resultText || "—"}
            </pre>

            <div className="mt-3 text-[11px]" style={{ color: UI.subtle }}>
              {coreJson?.ok ? "core ok" : coreJson ? "core error" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
