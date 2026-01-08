// src/app/seasons/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import URAFoundationPanel from "@/components/ura/URAFoundationPanel";

/**
 * Seasons Page (Client)
 * - Terminal interface for /api/core
 * - Displays URA Solar 8-phase context via /api/ura/context
 * - Renders URAFoundationPanel using its REQUIRED props:
 *   solarPhaseId, solarProgress01, sunText, ontology
 *
 * CHANGE (2026-01-08):
 * - Removed all text input areas from this page (no textarea).
 * - Payload is read-only, with controls to reset / update as_of_date / copy.
 */

type CoreResponse = {
  ok: boolean;
  text?: string;
  error?: string;
  input?: any;
  derived?: any;
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

// --- terminal palette ---
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

function defaultPayload() {
  return `birth_datetime: 1990-01-24 01:39
tz_offset: -05:00
lat: 36.585
lon: -79.395
as_of_date: ${todayYMDLocal()}`;
}

function patchAsOfDate(payload: string, ymd: string) {
  const lines = payload.split("\n");
  let found = false;
  const next = lines.map((ln) => {
    if (ln.trim().toLowerCase().startsWith("as_of_date:")) {
      found = true;
      return `as_of_date: ${ymd}`;
    }
    return ln;
  });
  if (!found) next.push(`as_of_date: ${ymd}`);
  return next.join("\n");
}

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS = [
  "Ari",
  "Tau",
  "Gem",
  "Can",
  "Leo",
  "Vir",
  "Lib",
  "Sco",
  "Sag",
  "Cap",
  "Aqu",
  "Pis",
] as const;

function signFromLon(lon: number) {
  return SIGNS[Math.floor(norm360(lon) / 30) % 12];
}

export default function SeasonsPage() {
  const [payloadText, setPayloadText] = useState<string>("");
  const [resultText, setResultText] = useState<string>("");
  const [coreJson, setCoreJson] = useState<CoreResponse | null>(null);
  const [uraCtx, setUraCtx] = useState<UraContext | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ---------- init ----------
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LS_KEY);
      if (saved && saved.trim()) setPayloadText(saved);
      else setPayloadText(defaultPayload());
    } catch {
      setPayloadText(defaultPayload());
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, payloadText);
    } catch {
      // ignore
    }
  }, [payloadText]);

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

  // --- Required props for URAFoundationPanel ---
  const solarPhaseId = useMemo(() => {
    const pid = uraCtx?.solar?.phaseId;
    if (typeof pid === "number" && Number.isFinite(pid)) return pid;
    return 1;
  }, [uraCtx?.solar?.phaseId]);

  const solarProgress01 = useMemo(() => {
    const p = uraCtx?.solar?.progress01;
    if (typeof p === "number" && Number.isFinite(p)) {
      return Math.max(0, Math.min(1, p));
    }
    return 0;
  }, [uraCtx?.solar?.progress01]);

  const sunText = useMemo(() => {
    const lon = uraCtx?.astro?.sunLon;
    if (typeof lon !== "number" || !Number.isFinite(lon)) return "Sun: —";
    const s = signFromLon(lon);
    return `Sun: ${s} ${norm360(lon).toFixed(2)}°`;
  }, [uraCtx?.astro?.sunLon]);

  const ontology = useMemo(() => uraCtx?.ontology ?? null, [uraCtx?.ontology]);

  const uraPhaseLabel = useMemo(() => `Phase ${solarPhaseId}`, [solarPhaseId]);

  const payloadLinesCount = useMemo(() => payloadText.split("\n").filter(Boolean).length, [payloadText]);

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

        {/* Top row */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            className="rounded-2xl border p-5 lg:col-span-2"
            style={{ borderColor: UI.border, background: UI.panel }}
          >
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
                <div className="mt-2 text-[12px]" style={{ color: UI.subtle }}>
                  {sunText}
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
                      width: `${Math.round(solarProgress01 * 100)}%`,
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

            <div className="mt-4">
              <URAFoundationPanel
                solarPhaseId={solarPhaseId}
                solarProgress01={solarProgress01}
                sunText={sunText}
                ontology={ontology}
              />
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
              Tip: This page will be replaced by a form once the pipeline is stable.
            </div>
          </div>
        </div>

        {/* Main: payload viewer + terminal output */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-5" style={{ borderColor: UI.border, background: UI.panel }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[12px] tracking-[0.18em] uppercase" style={{ color: UI.muted }}>
                  Payload
                </div>
                <div className="mt-1 text-[12px]" style={{ color: UI.subtle }}>
                  Read-only ({payloadLinesCount} lines). Stored as <span style={{ color: UI.text }}>{LS_KEY}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

                <button
                  onClick={() => setPayloadText(patchAsOfDate(payloadText, todayYMDLocal()))}
                  className="rounded-xl border px-3 py-2 text-[12px] hover:opacity-95"
                  style={{ borderColor: UI.border, background: "rgba(0,0,0,0.18)", color: UI.text }}
                  title="Updates only as_of_date"
                >
                  Today
                </button>

                <button
                  onClick={() => setPayloadText(defaultPayload())}
                  className="rounded-xl border px-3 py-2 text-[12px] hover:opacity-95"
                  style={{ borderColor: UI.border, background: "rgba(0,0,0,0.18)", color: UI.text }}
                  title="Resets full payload to template"
                >
                  Reset
                </button>
              </div>
            </div>

            <pre
              className="mt-4 w-full min-h-[320px] rounded-2xl border p-4 text-[12px] leading-relaxed overflow-auto"
              style={{
                borderColor: UI.border,
                background: "#0b0906",
                color: UI.text,
                fontFamily: "Menlo, Monaco, Consolas, monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {payloadText || "—"}
            </pre>
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
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
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
