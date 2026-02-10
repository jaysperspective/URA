// src/app/profile/ui/ProfileClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";
import type { HumanDesignProfile } from "@/lib/humandesign/types";
import URAFoundationPanel from "@/components/ura/URAFoundationPanel";
import { sabianFromLon } from "@/lib/sabian";
import HumanDesignReads from "./HumanDesignReads";

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"] as const;

function signFromLon(lon: number) {
  return SIGNS[Math.floor(norm360(lon) / 30) % 12];
}

function fmtLon(lon: number) {
  const x = norm360(lon);
  const degInSign = x % 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  return `${d}° ${String(m).padStart(2, "0")}'`;
}

function fmtSignPos(lon: number | null) {
  if (typeof lon !== "number" || !Number.isFinite(lon)) return "—";
  return `${signFromLon(lon)} ${fmtLon(lon)}`;
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function ProgressBar({
  value,
  labelLeft,
  labelRight,
  meta,
  slim = false,
}: {
  value: number;
  labelLeft: string;
  labelRight: string;
  meta?: string;
  slim?: boolean;
}) {
  const pct = clamp01(value) * 100;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-[#403A32]/70">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>

      {meta ? <div className="mt-1 text-xs text-[#403A32]/70">{meta}</div> : null}

      <div className={`mt-2 rounded-full bg-black/10 overflow-hidden ${slim ? "h-1.5" : "h-2"}`}>
        <div className="h-full rounded-full bg-[#8C8377]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * SeasonProgressCard - Combined card showing 90° season arc (primary) and 45° segment (secondary).
 */
function SeasonProgressCard({
  seasonArcDeg,
  seasonProgress01,
  ok,
}: {
  seasonArcDeg: number | null;
  seasonProgress01: number;
  ok: boolean;
}) {
  // Derive 45° segment values from the 90° arc
  const seasonSegDeg = seasonArcDeg != null ? seasonArcDeg % 45 : null;
  const segmentProgress01 = seasonSegDeg != null ? seasonSegDeg / 45 : 0;
  const segmentIndex = (seasonArcDeg ?? 0) < 45 ? 1 : 2;
  const segmentLabel = segmentIndex === 1 ? "0°–45°" : "45°–90°";

  return (
    <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
      {/* Header */}
      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
        Season Progress
      </div>
      <div className="mt-2 text-sm text-[#403A32]/75">
        Progress within the current season.
      </div>

      {/* Primary: 90° Season Arc */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-[#403A32]/70">
          <span className="font-medium">90° season arc</span>
          <span>90°</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#8C8377]"
            style={{ width: `${clamp01(seasonProgress01) * 100}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-[#403A32]/70">
          <span>
            {ok && typeof seasonArcDeg === "number"
              ? `${seasonArcDeg.toFixed(2)}° / 90°`
              : "—"}
          </span>
          <span className="text-[#403A32]/50">Segment: {segmentLabel}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-4 border-t border-black/5" />

      {/* Secondary: 45° Season Segment */}
      <div className="mt-3 pl-3">
        <div className="flex items-center justify-between text-xs text-[#403A32]/60">
          <span>45° season segment</span>
          <span>45°</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#8C8377]/80"
            style={{ width: `${clamp01(segmentProgress01) * 100}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-[#403A32]/60">
          <span>
            {ok && typeof seasonSegDeg === "number"
              ? `${seasonSegDeg.toFixed(2)}° / 45°`
              : "—"}
          </span>
          <span>Segment {segmentIndex} of 2</span>
        </div>
      </div>
    </div>
  );
}

function CardShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        "rounded-3xl border border-[#E2D9CC] bg-[#F4EFE6]",
        "shadow-[0_30px_120px_rgba(0,0,0,0.45)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function ProfileAvatar({ initialUrl, onUpload }: { initialUrl?: string | null; onUpload?: (url: string) => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with localStorage (fallback for when initialUrl is null but localStorage has value)
  React.useEffect(() => {
    if (!imageUrl) {
      try {
        const saved = localStorage.getItem("ura:profileImage");
        if (saved) setImageUrl(saved);
      } catch {
        // ignore
      }
    }
  }, [imageUrl]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.ok && data.url) {
        setImageUrl(data.url);
        localStorage.setItem("ura:profileImage", data.url);
        onUpload?.(data.url);
      }
    } catch {
      // ignore upload errors
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="h-12 w-12 rounded-2xl overflow-hidden border border-[#E2D9CC]/25 flex items-center justify-center transition hover:opacity-80"
        style={{
          background: imageUrl ? "transparent" : "#4A4A4A",
        }}
        title="Click to upload photo"
      >
        {uploading ? (
          <div
            className="h-5 w-5 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(244,239,230,0.3)", borderTopColor: "#F4EFE6" }}
          />
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt="Profile"
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "rgba(244,239,230,0.6)" }}
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        )}
      </button>
    </div>
  );
}

function SubCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#F8F2E8] px-5 py-4">
      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="min-w-[112px]">
      <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/70">{k}</div>
      <div className="mt-1 text-sm text-[#F4EFE6] font-medium">{v}</div>
    </div>
  );
}

function PersonalLunationCard({
  phase,
  subPhase,
  subWithinDeg,
  separationDeg,
  progressedSun,
  progressedMoon,
  directive,
}: {
  phase: string | null;
  subPhase: string | null;
  subWithinDeg: number | null;
  separationDeg: number | null;
  progressedSun: string;
  progressedMoon: string;
  directive: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const phaseLabel = phase?.trim() || "—";
  const subPhaseLabel = subPhase?.trim() || "";
  const combinedLabel = subPhaseLabel ? `${phaseLabel} / ${subPhaseLabel}` : phaseLabel;

  const subProgress01 = typeof subWithinDeg === "number" ? clamp01(subWithinDeg / 15) : 0;
  const separationNorm = typeof separationDeg === "number" ? norm360(separationDeg) : null;

  // Dial rendering
  const cx = 60;
  const cy = 60;
  const r = 42;
  const sep = separationNorm ?? 0;
  const angle = -90 + sep;
  const rad = (Math.PI / 180) * angle;
  const x2 = cx + r * Math.cos(rad);
  const y2 = cy + r * Math.sin(rad);

  return (
    <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] overflow-hidden">
      {/* Collapsed header - always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-black/[0.02] transition"
      >
        <div className="flex-1">
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
            Personal Lunation
          </div>
          <div className="mt-2 text-lg font-semibold text-[#1F1B16]">
            {combinedLabel}
          </div>
          <div className="mt-1 text-sm text-[#403A32]/75">{directive}</div>
        </div>

        <div className="flex items-center gap-4">
          {/* Mini dial indicator */}
          <svg width="48" height="48" viewBox="0 0 120 120" className="opacity-70">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="8" />
            {typeof separationNorm === "number" && (
              <>
                <circle cx={cx} cy={cy} r="3" fill="rgba(140,131,119,0.9)" />
                <line
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(140,131,119,0.9)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>

          <div
            className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center text-[#403A32]/60"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-black/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Details */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-3">
                <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55">
                  Progressed Positions
                </div>
                <div className="mt-2 text-sm text-[#1F1B16]">
                  <div className="flex justify-between py-1">
                    <span className="text-[#403A32]/70">Sun</span>
                    <span className="font-medium">{progressedSun}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#403A32]/70">Moon</span>
                    <span className="font-medium">{progressedMoon}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-3">
                <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55">
                  Sub-phase progress (0-15)
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-[#403A32]/70 mb-1">
                    <span>0</span>
                    <span>15</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#8C8377]"
                      style={{ width: `${subProgress01 * 100}%` }}
                    />
                  </div>
                  {typeof subWithinDeg === "number" && (
                    <div className="mt-1 text-xs text-[#403A32]/60">
                      {subWithinDeg.toFixed(1)} / 15
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Larger dial */}
            <div className="flex flex-col items-center justify-center">
              <svg width="140" height="140" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="12" />
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="rgba(0,0,0,0.05)"
                  strokeWidth="12"
                  strokeDasharray="3 12"
                />

                {/* Cardinal markers */}
                <line x1="100" y1="20" x2="100" y2="35" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
                <line x1="180" y1="100" x2="165" y2="100" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
                <line x1="100" y1="180" x2="100" y2="165" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
                <line x1="20" y1="100" x2="35" y2="100" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />

                {/* Labels */}
                <text x="100" y="12" textAnchor="middle" fontSize="8" fill="rgba(64,58,50,0.5)" letterSpacing="1">NEW</text>
                <text x="188" y="103" textAnchor="middle" fontSize="8" fill="rgba(64,58,50,0.5)" letterSpacing="1">1Q</text>
                <text x="100" y="195" textAnchor="middle" fontSize="8" fill="rgba(64,58,50,0.5)" letterSpacing="1">FULL</text>
                <text x="12" y="103" textAnchor="middle" fontSize="8" fill="rgba(64,58,50,0.5)" letterSpacing="1">3Q</text>

                {/* Hand */}
                {typeof separationNorm === "number" && (
                  <>
                    <circle cx="100" cy="100" r="5" fill="rgba(140,131,119,0.95)" />
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + 70 * Math.cos((Math.PI / 180) * (-90 + separationNorm))}
                      y2={100 + 70 * Math.sin((Math.PI / 180) * (-90 + separationNorm))}
                      stroke="rgba(140,131,119,0.95)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={100 + 70 * Math.cos((Math.PI / 180) * (-90 + separationNorm))}
                      cy={100 + 70 * Math.sin((Math.PI / 180) * (-90 + separationNorm))}
                      r="5"
                      fill="rgba(140,131,119,0.95)"
                    />
                  </>
                )}
              </svg>
              <div className="mt-2 text-sm text-[#403A32]/70">
                {typeof separationNorm === "number" ? `${separationNorm.toFixed(1)} separation` : "—"}
              </div>
            </div>
          </div>

          {/* Lunation Explainer */}
          <div className="mt-5 rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-4">
            <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55 mb-2">
              About Your Lunation Cycle
            </div>
            <div className="space-y-2 text-sm text-[#403A32]/80 leading-relaxed">
              <p>
                The Progressed Lunation Cycle tracks the relationship between your progressed Sun and
                progressed Moon over a roughly 29-30 year period.
              </p>
              <p>
                Using secondary progressions (where one day after birth equals one year of life),
                URA calculates the angular separation between your progressed Sun and Moon.
              </p>
              <p>
                Each phase represents a distinct quality of inner development. The cycle does not
                predict events—it orients you to your current developmental season.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/lunation"
              className="rounded-2xl bg-[#151515] text-[#F4EFE6] px-4 py-2 text-sm border border-[#E2D9CC]/25 hover:bg-[#1E1E1E]"
            >
              Open /lunation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HUMAN DESIGN CARD
// ============================================================================

function HumanDesignCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hd, setHd] = useState<HumanDesignProfile | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchHD() {
      try {
        const res = await fetch("/api/human-design", { cache: "no-store" });
        const data = await res.json();

        if (!mounted) return;

        if (data.ok && data.humanDesign) {
          setHd(data.humanDesign);
          setError(null);
        } else {
          setError(data.error || "Failed to load Human Design");
        }
      } catch (err) {
        if (!mounted) return;
        setError("Failed to load Human Design");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchHD();
    return () => {
      mounted = false;
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] overflow-hidden">
        <div className="px-6 py-5">
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
            Human Design
          </div>
          <div className="mt-2 text-sm text-[#403A32]/70 animate-pulse">
            Computing your design...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !hd) {
    return (
      <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] overflow-hidden">
        <div className="px-6 py-5">
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
            Human Design
          </div>
          <div className="mt-2 text-sm text-[#8B6F47]">
            {error || "Unable to compute Human Design"}
          </div>
        </div>
      </div>
    );
  }

  // Format defined centers for display
  const definedCentersText = hd.defined.centers
    .filter((c) => c.defined)
    .map((c) => c.name)
    .join(", ") || "None";

  // Format channels for display
  const channelsDisplay = hd.defined.channels.slice(0, 5);

  // Anchor activations (Personality & Design Sun/Earth)
  const anchors = [
    { label: "Personality Sun", gate: hd.personality.Sun.gate, line: hd.personality.Sun.line },
    { label: "Personality Earth", gate: hd.personality.Earth.gate, line: hd.personality.Earth.line },
    { label: "Design Sun", gate: hd.designActivations.Sun.gate, line: hd.designActivations.Sun.line },
    { label: "Design Earth", gate: hd.designActivations.Earth.gate, line: hd.designActivations.Earth.line },
  ];

  return (
    <div className="rounded-3xl border border-black/10 bg-[#F8F2E8] overflow-hidden">
      {/* Collapsed header - always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-black/[0.02] transition"
      >
        <div className="flex-1">
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
            Human Design
          </div>
          <div className="mt-2 text-lg font-semibold text-[#1F1B16]">
            {hd.type}
          </div>
          <div className="mt-1 text-sm text-[#403A32]/75">
            {hd.profile} • {hd.authority} Authority
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Type indicator */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
            style={{
              background:
                hd.type === "Generator" || hd.type === "Manifesting Generator"
                  ? "rgba(139,111,71,0.15)"
                  : hd.type === "Projector"
                  ? "rgba(64,58,50,0.12)"
                  : hd.type === "Manifestor"
                  ? "rgba(100,80,60,0.15)"
                  : "rgba(140,131,119,0.12)",
            }}
          >
            {hd.type === "Generator"
              ? "⚡"
              : hd.type === "Manifesting Generator"
              ? "⚡"
              : hd.type === "Projector"
              ? "◎"
              : hd.type === "Manifestor"
              ? "▶"
              : "◯"}
          </div>

          <div
            className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center text-[#403A32]/60"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-black/5">
          <HumanDesignReads>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Core Info */}
            <div className="space-y-4">
              {/* Type, Strategy, Authority */}
              <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-3">
                <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55">
                  Core Identity
                </div>
                <div className="mt-2 text-sm text-[#1F1B16] space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-[#403A32]/70">Type</span>
                    <span className="font-medium">{hd.type}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#403A32]/70">Strategy</span>
                    <span className="font-medium">{hd.strategy}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#403A32]/70">Authority</span>
                    <span className="font-medium">{hd.authority}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#403A32]/70">Profile</span>
                    <span className="font-medium">{hd.profile}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#403A32]/70">Definition</span>
                    <span className="font-medium capitalize">{hd.defined.definitionType}</span>
                  </div>
                </div>
              </div>

              {/* Defined Centers */}
              <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-3">
                <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55">
                  Defined Centers
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hd.defined.centers.map((c) => (
                    <span
                      key={c.name}
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        c.defined
                          ? "bg-[#8C8377]/20 text-[#1F1B16]"
                          : "bg-black/5 text-[#403A32]/40"
                      }`}
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Channels & Anchors */}
            <div className="space-y-4">
              {/* Channels */}
              {hd.defined.channels.length > 0 && (
                <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-3">
                  <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55">
                    Defined Channels ({hd.defined.channels.length})
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {channelsDisplay.map((ch) => (
                      <div key={ch.name} className="text-sm text-[#1F1B16]">
                        <span className="font-medium">{ch.name}</span>
                        {ch.displayName && (
                          <span className="text-[#403A32]/60 ml-2">{ch.displayName}</span>
                        )}
                      </div>
                    ))}
                    {hd.defined.channels.length > 5 && (
                      <div className="text-xs text-[#403A32]/50">
                        +{hd.defined.channels.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Anchor Activations */}
              <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-3">
                <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55">
                  Anchor Activations
                </div>
                <div className="mt-2 text-sm text-[#1F1B16] space-y-1.5">
                  {anchors.map((a) => (
                    <div key={a.label} className="flex justify-between">
                      <span className="text-[#403A32]/70 text-xs">{a.label}</span>
                      <span className="font-medium">
                        Gate {a.gate}.{a.line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Explainer */}
          <div className="mt-5 rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-4">
            <div className="text-[10px] tracking-[0.18em] uppercase text-[#403A32]/55 mb-2">
              About Human Design
            </div>
            <div className="space-y-2 text-sm text-[#403A32]/80 leading-relaxed">
              <p>
                Human Design is a synthesis system that combines elements of astrology, the I Ching,
                Kabbalah, and the chakra system. It uses your exact birth time and location to calculate
                activations at both your birth moment (Personality) and approximately 88 days prior (Design).
              </p>
              <p>
                Your Type determines how you're designed to interact with the world. Your Authority
                indicates your optimal decision-making process. Your Profile describes your life role.
              </p>
            </div>
          </div>
          </HumanDesignReads>
        </div>
      )}
    </div>
  );
}

type NatalPlanets = {
  sun: number | null;
  moon: number | null;
  mercury: number | null;
  venus: number | null;
  mars: number | null;
  jupiter: number | null;
  saturn: number | null;
  uranus: number | null;
  neptune: number | null;
  pluto: number | null;
  chiron: number | null;
  northNode: number | null;
  southNode: number | null;
};

// Handoff data from /sun page
type HandoffData = {
  from?: string;
  ts?: string;
  focus?: string;
  dominant?: "solar" | "lunar" | "transitional";
} | null;

type Props = {
  name: string;
  locationLine: string;
  timezone: string;
  asOfISO: string | null;

  natalAscLon: number | null;
  natalMcLon?: number | null;

  natalSunLon: number | null;
  natalMoonLon: number | null;

  natalPlanets?: Partial<NatalPlanets> | null;

  currentSunLon: number | null;

  progressedSunLon: number | null;
  progressedMoonLon: number | null;

  lunationPhase?: string | null;
  lunationSubPhase?: string | null;
  lunationSubWithinDeg?: number | null;
  lunationSeparationDeg?: number | null;

  ascYearCyclePosDeg: number | null;
  ascYearSeason: string | null;
  ascYearModality: string | null;
  ascYearDegreesIntoModality: number | null;

  // Handoff from /sun page
  handoffFromSun?: HandoffData;

  // Avatar
  avatarUrl?: string | null;
};

function phaseIdFromCyclePos45(cyclePosDeg: number): PhaseId {
  const pos = norm360(cyclePosDeg);
  const idx = Math.floor(pos / 45);
  return (idx + 1) as PhaseId;
}

function seasonFromCyclePos(cyclePosDeg: number) {
  const pos = norm360(cyclePosDeg);
  const idx = Math.floor(pos / 90);
  return (["Spring", "Summer", "Fall", "Winter"][Math.max(0, Math.min(3, idx))] ?? "Spring") as
    | "Spring"
    | "Summer"
    | "Fall"
    | "Winter";
}

function modalityFromWithinSeason(withinSeasonDeg: number) {
  const idx = Math.floor(withinSeasonDeg / 30);
  return (["Cardinal", "Fixed", "Mutable"][Math.max(0, Math.min(2, idx))] ?? "Cardinal") as
    | "Cardinal"
    | "Fixed"
    | "Mutable";
}

function fmtAsOfLabel(asOfISO: string | null, tz: string) {
  if (!asOfISO) return undefined;
  const d = new Date(asOfISO);
  if (!Number.isFinite(d.getTime())) return undefined;

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function planetLabel(k: keyof NatalPlanets) {
  const map: Record<keyof NatalPlanets, string> = {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
    chiron: "Chiron",
    northNode: "North Node",
    southNode: "South Node",
  };
  return map[k];
}

type BriefOk = {
  ok: true;
  version: "1.0";
  cached?: boolean;
  output: {
    headline: string;
    meaning: string;
    story: string;
    do_now: string[];
    avoid: string[];
    journal: string;
    confidence: "low" | "medium" | "high";
    usedFields?: string[];
    element?: {
      name: string;
      meaning: string;
    };
  };
  meta?: { model?: string };
};

type BriefErr = { ok: false; error: string; code?: string };
type BriefResp = BriefOk | BriefErr;

function getDayKeyInTZ(tz: string, d = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    const x = new Date();
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
}

// Expand abbreviations to full sign names for /astrology inputs
const SIGN_EXPAND: Record<(typeof SIGNS)[number], string> = {
  Ari: "Aries",
  Tau: "Taurus",
  Gem: "Gemini",
  Can: "Cancer",
  Leo: "Leo",
  Vir: "Virgo",
  Lib: "Libra",
  Sco: "Scorpio",
  Sag: "Sagittarius",
  Cap: "Capricorn",
  Aqu: "Aquarius",
  Pis: "Pisces",
};

function expandAbbrevSign(signPos: string) {
  // "Cap 03° 46'" -> "Capricorn 03° 46'"
  const parts = (signPos || "").trim().split(/\s+/);
  if (!parts.length) return signPos;
  const head = parts[0] as (typeof SIGNS)[number];
  const full = SIGN_EXPAND[head];
  if (!full) return signPos;
  return [full, ...parts.slice(1)].join(" ");
}

export default function ProfileClient(props: Props) {
  const router = useRouter();

  const {
    name,
    locationLine,
    timezone,
    asOfISO,

    natalAscLon,
    natalMcLon,

    natalSunLon,
    natalMoonLon,

    natalPlanets,

    currentSunLon,

    progressedSunLon,
    progressedMoonLon,

    lunationPhase,
    lunationSubPhase,
    lunationSubWithinDeg,
    lunationSeparationDeg,

    ascYearCyclePosDeg,
    ascYearSeason,
    ascYearModality,
    ascYearDegreesIntoModality,

    handoffFromSun,
    avatarUrl,
  } = props;

  const [showAllPlacements, setShowAllPlacements] = useState(false);
  const [showHandoffBanner, setShowHandoffBanner] = useState(!!handoffFromSun);

  // Daily Brief (LLM)
  const [briefLoading, setBriefLoading] = useState(false);
  const [brief, setBrief] = useState<BriefResp | null>(null);

  const natalAsc = fmtSignPos(natalAscLon);
  const natalMc = fmtSignPos(typeof natalMcLon === "number" ? natalMcLon : null);
  const natalSun = fmtSignPos(natalSunLon);
  const natalMoon = fmtSignPos(natalMoonLon);

  const progressedSun = fmtSignPos(progressedSunLon);
  const progressedMoon = fmtSignPos(progressedMoonLon);

  const lunationLine = useMemo(() => {
    const p = lunationPhase?.trim() || "";
    const s = lunationSubPhase?.trim() || "";
    if (p && s) return `${p} • ${s}`;
    return p || s || "—";
  }, [lunationPhase, lunationSubPhase]);

  const subPhaseProgress01 = useMemo(() => {
    if (typeof lunationSubWithinDeg !== "number") return 0;
    return clamp01(lunationSubWithinDeg / 15);
  }, [lunationSubWithinDeg]);

  const currentZodiac = useMemo(() => {
    if (typeof currentSunLon === "number") return fmtSignPos(currentSunLon);
    if (typeof progressedSunLon === "number") return fmtSignPos(progressedSunLon);
    return "—";
  }, [currentSunLon, progressedSunLon]);

  const asOfLine = useMemo(() => {
    if (!asOfISO) return timezone;
    const d = new Date(asOfISO);
    return `${timezone} • ${d.toLocaleString(undefined, {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [asOfISO, timezone]);

  const cyclePosTruth = useMemo(() => {
    if (typeof natalAscLon === "number" && typeof currentSunLon === "number") {
      return norm360(currentSunLon - natalAscLon);
    }
    if (typeof ascYearCyclePosDeg === "number") return norm360(ascYearCyclePosDeg);
    return null;
  }, [natalAscLon, currentSunLon, ascYearCyclePosDeg]);

  const orientation = useMemo(() => {
    const ok = typeof cyclePosTruth === "number" && Number.isFinite(cyclePosTruth);
    const cyclePos = ok ? norm360(cyclePosTruth!) : null;

    const seasonText = ok ? seasonFromCyclePos(cyclePos!) : (ascYearSeason || "—");
    const withinSeason = ok ? (cyclePos! % 90) : null;
    const seasonProgress01 = withinSeason != null ? withinSeason / 90 : 0;

    const modalityText =
      ok && withinSeason != null ? modalityFromWithinSeason(withinSeason) : (ascYearModality || "—");

    const withinModality =
      ok && withinSeason != null
        ? withinSeason % 30
        : typeof ascYearDegreesIntoModality === "number"
        ? ascYearDegreesIntoModality
        : null;

    const modalityProgress01 = withinModality != null ? withinModality / 30 : 0;

    const uraPhaseId = ok ? phaseIdFromCyclePos45(cyclePos!) : (1 as PhaseId);
    const uraDegIntoPhase = ok ? (cyclePos! % 45) : null;
    const uraProgress01 = uraDegIntoPhase != null ? uraDegIntoPhase / 45 : null;

    return {
      ok,
      cyclePos,
      seasonText,
      modalityText,
      seasonProgress01,
      withinSeason,
      withinModality,
      modalityProgress01,
      uraPhaseId,
      uraDegIntoPhase,
      uraProgress01,
    };
  }, [cyclePosTruth, ascYearSeason, ascYearModality, ascYearDegreesIntoModality]);

  const phaseCopy = useMemo(() => microcopyForPhase(orientation.uraPhaseId), [orientation.uraPhaseId]);

  // Lunation-specific phase ID (derived from progressed sun-moon separation)
  const lunationPhaseId = useMemo((): PhaseId => {
    if (typeof lunationSeparationDeg !== "number") return 1 as PhaseId;
    const sep = norm360(lunationSeparationDeg);
    // Map 0-360 separation to 8 phases (45° each)
    const idx = Math.floor((sep + 22.5) / 45) % 8;
    return (idx + 1) as PhaseId;
  }, [lunationSeparationDeg]);

  const lunationCopy = useMemo(() => microcopyForPhase(lunationPhaseId), [lunationPhaseId]);

  const sunTextForFoundation = useMemo(() => {
    if (typeof currentSunLon === "number") return fmtSignPos(currentSunLon);
    if (typeof progressedSunLon === "number") return fmtSignPos(progressedSunLon);
    return "—";
  }, [currentSunLon, progressedSunLon]);

  const asOfLabelForFoundation = useMemo(() => fmtAsOfLabel(asOfISO, timezone), [asOfISO, timezone]);

  const allNatalList = useMemo(() => {
    const p = natalPlanets ?? {};
    const keys: (keyof NatalPlanets)[] = [
      "sun",
      "moon",
      "mercury",
      "venus",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "pluto",
      "chiron",
      "northNode",
      "southNode",
    ];

    return keys.map((k) => ({
      key: k,
      label: planetLabel(k),
      value: fmtSignPos(typeof p[k] === "number" ? (p[k] as number) : null),
    }));
  }, [natalPlanets]);

  // ✅ Build placements to handoff to /astrology (full sign names, keep degrees)
  const natalPlacementsForAstrology = useMemo(() => {
    const out: string[] = [];
    const p = natalPlanets ?? {};

    const add = (label: string, lon: number | null | undefined) => {
      if (typeof lon !== "number" || !Number.isFinite(lon)) return;
      const signPos = expandAbbrevSign(fmtSignPos(lon));
      out.push(`${label} ${signPos}`);
    };

    add("Sun", typeof p.sun === "number" ? (p.sun as number) : null);
    add("Moon", typeof p.moon === "number" ? (p.moon as number) : null);
    add("Mercury", typeof p.mercury === "number" ? (p.mercury as number) : null);
    add("Venus", typeof p.venus === "number" ? (p.venus as number) : null);
    add("Mars", typeof p.mars === "number" ? (p.mars as number) : null);
    add("Jupiter", typeof p.jupiter === "number" ? (p.jupiter as number) : null);
    add("Saturn", typeof p.saturn === "number" ? (p.saturn as number) : null);
    add("Uranus", typeof p.uranus === "number" ? (p.uranus as number) : null);
    add("Neptune", typeof p.neptune === "number" ? (p.neptune as number) : null);
    add("Pluto", typeof p.pluto === "number" ? (p.pluto as number) : null);
    add("Chiron", typeof p.chiron === "number" ? (p.chiron as number) : null);

    // Nodes (stored as northNode / southNode in this component)
    add("North Node", typeof p.northNode === "number" ? (p.northNode as number) : null);
    add("South Node", typeof p.southNode === "number" ? (p.southNode as number) : null);

    // NOTE: ASC/MC are display-only right now; you can include them later if doctrine supports angles.
    // if (typeof natalAscLon === "number") out.unshift(`ASC ${expandAbbrevSign(fmtSignPos(natalAscLon))}`);
    // if (typeof natalMcLon === "number") out.unshift(`MC ${expandAbbrevSign(fmtSignPos(natalMcLon as number))}`);

    return out;
  }, [natalPlanets]);

  const sabian = useMemo(() => {
    if (typeof currentSunLon !== "number") return null;
    return sabianFromLon(currentSunLon);
  }, [currentSunLon]);

  const sabianSentence = useMemo(() => {
    if (!sabian) return null;
    const sym = (sabian.symbol ?? "").trim();
    const looksPlaceholder = /a moment in/i.test(sym) || /learning its/i.test(sym);
    if (sym && !looksPlaceholder && sym !== "—") return sym;

    const fallback =
      (sabian.signal ?? "").trim() ||
      (sabian.directive ?? "").trim() ||
      (sabian.practice ?? "").trim() ||
      "—";

    return fallback;
  }, [sabian]);

  const dayKey = useMemo(() => getDayKeyInTZ(timezone), [timezone]);

  async function generateDailyBrief() {
    setBriefLoading(true);
    setBrief(null);

    try {
      const payload = {
        version: "1.0" as const,
        dayKey,
        timezone,
        context: {
          season: orientation.ok ? orientation.seasonText : (ascYearSeason || "—"),
          phaseId: orientation.uraPhaseId,
          cyclePosDeg: typeof orientation.cyclePos === "number" ? orientation.cyclePos : null,
          degIntoPhase: typeof orientation.uraDegIntoPhase === "number" ? orientation.uraDegIntoPhase : null,
          phaseProgress01: typeof orientation.uraProgress01 === "number" ? orientation.uraProgress01 : null,

          phaseHeader: `${phaseCopy.season} · Phase ${orientation.uraPhaseId}`,
          phaseOneLine: phaseCopy.oneLine,
          phaseDescription: phaseCopy.description,
          phaseActionHint: phaseCopy.actionHint ?? null,
          journalPrompt: phaseCopy.journalPrompt,
          journalHelper: phaseCopy.journalHelper,

          currentSun: currentZodiac,
          lunation: lunationLine,
          progressed: `${progressedSun} • ${progressedMoon}`,
          asOf: asOfLine,
        },

        sabian: sabian
          ? {
              idx: sabian.idx,
              key: sabian.key,
              sign: sabian.sign,
              degree: sabian.degree,
              symbol: sabian.symbol,
              signal: sabian.signal,
              shadow: sabian.shadow,
              directive: sabian.directive,
              practice: sabian.practice,
              journal: sabian.journal,
              tags: sabian.tags ?? [],
            }
          : null,

        output: { maxDoNow: 3, maxAvoid: 2, maxSentencesMeaning: 4 },
        constraints: { noPrediction: true, noNewClaims: true, citeInputs: true },
      };

      const r = await fetch("/api/profile/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = (await r.json()) as BriefResp;
      setBrief(data);
    } catch (e: any) {
      setBrief({ ok: false, error: e?.message || "Daily Brief failed." });
    } finally {
      setBriefLoading(false);
    }
  }

  function openAstrologyWithNatal() {
    try {
      sessionStorage.setItem(
        "ura:natalPlacements",
        JSON.stringify({
          v: 1,
          createdAt: Date.now(),
          placements: natalPlacementsForAstrology,
        })
      );
    } catch {
      // ignore
    }
    router.push("/astrology?auto=natal");
  }

  return (
    <div className="mt-8">
      {/* HANDOFF BANNER - shown when arriving from /sun */}
      {showHandoffBanner && handoffFromSun && (
        <div className="mx-auto max-w-5xl mb-4">
          <div
            className="rounded-2xl border px-5 py-4 relative"
            style={{
              background: "linear-gradient(135deg, rgba(200,178,106,0.15) 0%, rgba(127,168,161,0.10) 100%)",
              borderColor: "rgba(200,178,106,0.35)",
            }}
          >
            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => setShowHandoffBanner(false)}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-xs hover:bg-white/10 transition"
              style={{ color: "var(--ura-text-muted)" }}
              aria-label="Dismiss banner"
            >
              ×
            </button>

            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(200,178,106,0.25)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ura-text-primary)" }}>
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--ura-text-primary)" }}>
                  Personal view loaded
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--ura-text-secondary)" }}>
                  Personal Frame · Ascendant Anchor
                </div>
                {handoffFromSun.dominant && (
                  <div className="mt-2 text-xs" style={{ color: "var(--ura-text-muted)" }}>
                    From /sun: {handoffFromSun.dominant} layer emphasized
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP STRIP */}
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <ProfileAvatar initialUrl={avatarUrl} />

            <div>
              <div className="text-[#F4EFE6]/80 text-sm">Profile</div>
              <div className="text-[#F4EFE6] text-lg font-semibold leading-tight">{name}</div>
              <div className="text-[#F4EFE6]/65 text-sm">{locationLine}</div>
            </div>
          </div>

          {/* placements module */}
          <div className="w-full md:w-auto md:min-w-[560px]">
            <div className="rounded-3xl border border-[#E2D9CC]/20 bg-black/20 backdrop-blur px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/60">
                    Natal placements
                  </div>
                  <div className="mt-1 text-sm text-[#F4EFE6]/90">Tap expand to view all planets.</div>

                  {/* ✅ UPDATED: deep link to astrology + writes natal placements to sessionStorage */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={openAstrologyWithNatal}
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs hover:bg-white/10"
                      style={{
                        borderColor: "rgba(226,217,204,0.28)",
                        color: "rgba(244,239,230,0.85)",
                      }}
                    >
                      Open in /astrology →
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllPlacements((v) => !v)}
                  className="rounded-full border px-3 py-1.5 text-xs hover:bg-white/10"
                  style={{ borderColor: "rgba(226,217,204,0.28)", color: "rgba(244,239,230,0.85)" }}
                >
                  {showAllPlacements ? "Collapse" : "Expand"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-6">
                <Chip k="ASC" v={natalAsc} />
                <Chip k="MC" v={natalMc} />
                <Chip k="SUN" v={natalSun} />
                <Chip k="MOON" v={natalMoon} />
              </div>

              {showAllPlacements ? (
                <div className="mt-4 rounded-2xl border border-[#E2D9CC]/15 bg-black/15 px-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allNatalList.map((row) => (
                      <div key={row.key} className="rounded-xl border border-[#E2D9CC]/10 bg-black/10 px-3 py-2">
                        <div className="text-[10px] tracking-[0.18em] uppercase text-[#F4EFE6]/55">
                          {row.label}
                        </div>
                        <div className="mt-1 text-sm text-[#F4EFE6]/90 font-medium">{row.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-[11px] text-[#F4EFE6]/55">
                    Note: Nodes/Chiron show when present in the cached natal chart.
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-6">
                <Chip k="SUN (PROG)" v={progressedSun} />
                <Chip k="MOON (PROG)" v={progressedMoon} />
                <Chip k="LUNATION" v={lunationLine} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="mt-8 mx-auto max-w-5xl">
        <CardShell>
          <div className="px-8 pt-10 pb-8">
            <div className="text-center">
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">
                Orientation (Asc-Year)
              </div>

              <div className="mt-2 text-3xl font-semibold tracking-tight text-[#1F1B16] leading-tight">
                <div className="flex justify-center">
                  <div>{orientation.ok ? orientation.seasonText : "—"}</div>
                </div>
              </div>

              <div className="mt-2 text-sm text-[#403A32]/75">
                {orientation.ok && typeof orientation.cyclePos === "number"
                  ? `Asc-Year cycle position: ${orientation.cyclePos.toFixed(2)}° (0–360)`
                  : "Cycle position unavailable."}
              </div>
            </div>

            {/* ✅ Foundation panel moved ABOVE Daily Brief */}
            <div className="mt-4">
              <URAFoundationPanel
                solarPhaseId={orientation.uraPhaseId}
                solarProgress01={orientation.uraProgress01}
                sunText={sunTextForFoundation}
                ontology={null}
                asOfLabel={asOfLabelForFoundation}
              />
            </div>

            {/* DAILY BRIEF */}
            <div className="mt-4 rounded-3xl border border-black/10 bg-[#F8F2E8] px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Daily Brief</div>
                  <div className="mt-2 text-lg font-semibold text-[#1F1B16]">Phase + Sun Degree</div>

                  <div className="mt-1 text-sm text-[#403A32]/85">
                    {sabian ? (
                      <>
                        <span className="font-semibold text-[#1F1B16]">{sabian.key}</span>
                        <span className="mx-2">•</span>
                        <span>{sabianSentence}</span>
                      </>
                    ) : (
                      "Sabian unavailable (missing current Sun)."
                    )}
                  </div>

                  <div className="mt-1 text-xs text-[#403A32]/65">Day key: {dayKey}</div>
                </div>

                <button
                  type="button"
                  onClick={generateDailyBrief}
                  disabled={briefLoading}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm border transition",
                    "bg-[#F4EFE6] text-[#1F1B16]",
                    "border-black/25 hover:bg-black/5",
                    briefLoading ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {briefLoading ? "Generating…" : brief ? "Refresh" : "Generate"}
                </button>
              </div>

              {brief && !brief.ok ? <div className="mt-3 text-sm text-red-700">{brief.error}</div> : null}

              {brief && brief.ok ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Headline</div>
                    <div className="mt-1 text-base font-semibold text-[#1F1B16]">{brief.output.headline}</div>
                    {brief.cached && (
                      <div className="mt-1 text-xs text-[#403A32]/50">(cached for today)</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Meaning</div>
                    <div className="mt-1 text-sm text-[#403A32]/85 leading-relaxed">{brief.output.meaning}</div>
                    {brief.output.element && (
                      <div className="mt-2 text-xs text-[#403A32]/60">
                        Element: {brief.output.element.name} — {brief.output.element.meaning}
                      </div>
                    )}
                  </div>

                  {brief.output.story && (
                    <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Story</div>
                      <div className="mt-2 text-sm text-[#403A32]/85 leading-relaxed italic">{brief.output.story}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Do now</div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-[#403A32]/85">
                        {(brief.output.do_now ?? []).map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                      <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Avoid</div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-[#403A32]/85">
                        {(brief.output.avoid ?? []).map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-[#F4EFE6] px-4 py-3">
                    <div className="text-[11px] tracking-[0.18em] uppercase text-[#403A32]/60">Journal</div>
                    <div className="mt-2 text-sm font-semibold text-[#1F1B16]">{brief.output.journal}</div>
                    <div className="mt-2 text-xs text-[#403A32]/65">Confidence: {brief.output.confidence}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-[#403A32]/70">
                  {briefLoading ? "Generating your daily brief…" : "No brief yet. Click Generate."}
                </div>
              )}
            </div>

            {/* SEASON PROGRESS (combined 90° + 45° nested) */}
            <div className="mt-4">
              <SeasonProgressCard
                seasonArcDeg={orientation.withinSeason}
                seasonProgress01={orientation.seasonProgress01}
                ok={orientation.ok}
              />
            </div>

            {/* HUMAN DESIGN */}
            <div className="mt-8">
              <HumanDesignCard />
            </div>

            {/* PERSONAL LUNATION */}
            <div className="mt-8">
              <PersonalLunationCard
                phase={lunationPhase ?? null}
                subPhase={lunationSubPhase ?? null}
                subWithinDeg={lunationSubWithinDeg ?? null}
                separationDeg={lunationSeparationDeg ?? null}
                progressedSun={progressedSun}
                progressedMoon={progressedMoon}
                directive={lunationCopy.oneLine}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <Link
                href="/sun"
                className="rounded-2xl bg-[#F4EFE6] text-[#151515] px-4 py-2 text-sm border border-black/15 hover:bg-[#EFE7DB]"
              >
                Go to /sun
              </Link>
            </div>

            <div className="mt-5 text-center text-xs text-[#403A32]/70">{asOfLine}</div>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
