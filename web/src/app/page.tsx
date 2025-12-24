// src/app/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

const BG = "#333131";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function IntroPage() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const x = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
      const y = Math.min(1, Math.max(0, e.clientY / window.innerHeight));
      setPos({ x, y });
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const drift = useMemo(() => {
    const dx = (pos.x - 0.5) * 18;
    const dy = (pos.y - 0.5) * 18;
    return { dx, dy };
  }, [pos.x, pos.y]);

  return (
    <div
      className="relative min-h-[100svh] w-full overflow-hidden text-white"
      style={{ backgroundColor: BG }}
    >
      {/* Ambient vignette + subtle moving light */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 50% 30%, rgba(255,255,255,0.10), rgba(0,0,0,0) 60%), radial-gradient(1200px 700px at 50% 110%, rgba(255,255,255,0.05), rgba(0,0,0,0) 60%)",
          transform: `translate(${drift.dx * 0.25}px, ${drift.dy * 0.25}px)`,
          transition: "transform 120ms ease-out",
        }}
      />

      {/* Film grain overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay grain" />

      {/* Content */}
      <main className="relative z-10 flex min-h-[100svh] items-center justify-center px-6">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col items-center text-center">
            {/* Title */}
            <h1 className="select-none text-[40px] sm:text-[54px] font-light tracking-[0.35em]">
              URA&nbsp;&nbsp;ASTRO&nbsp;&nbsp;SYSTEM
            </h1>

            {/* Subline */}
            <div className="mt-3 text-[12px] tracking-[0.28em] uppercase text-white/55">
              an orientation engine for cycles, timing, and meaning
            </div>

            {/* Buttons (boxed) */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/signup"
                className={cx(
                  "btn-frame",
                  "px-12 py-4 text-[12px] tracking-[0.35em] uppercase"
                )}
              >
                SIGN&nbsp;UP
              </Link>

              <Link
                href="/login"
                className={cx(
                  "btn-frame",
                  "px-12 py-4 text-[12px] tracking-[0.35em] uppercase"
                )}
              >
                LOG&nbsp;IN
              </Link>
            </div>

            <div className="mt-6">
              <Link
                href="/about"
                className={cx(
                  "btn-frame",
                  "px-16 py-4 text-[12px] tracking-[0.35em] uppercase"
                )}
              >
                ABOUT&nbsp;THIS&nbsp;SYSTEM
              </Link>
            </div>

            {/* Orbital symbol (pulled up + slightly smaller) */}
            <div
              className="mt-12 sm:mt-14 opacity-85"
              style={{
                transform: `translate(${drift.dx * 0.25}px, ${drift.dy * 0.25}px)`,
                transition: "transform 140ms ease-out",
              }}
            >
              <div className="orbital">
                <svg
                  width="260"
                  height="260"
                  viewBox="0 0 260 260"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="130"
                    cy="130"
                    r="90"
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <ellipse
                    cx="130"
                    cy="130"
                    rx="120"
                    ry="45"
                    transform="rotate(-25 130 130)"
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.9"
                  />
                </svg>
              </div>
            </div>

            {/* Footer microcopy (kept, tighter) */}
            <div className="mt-10 text-[11px] text-white/40 tracking-[0.20em] uppercase">
              enter quietly · observe precisely
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .grain {
          background-image:
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.20) 0.5px, transparent 0.6px),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.15) 0.5px, transparent 0.7px),
            radial-gradient(circle at 40% 60%, rgba(255,255,255,0.12) 0.5px, transparent 0.7px);
          background-size: 140px 140px, 180px 180px, 220px 220px;
          animation: grainMove 10s linear infinite;
        }
        @keyframes grainMove {
          0% { transform: translate3d(0,0,0); }
          100% { transform: translate3d(-140px,-140px,0); }
        }

        .btn-frame {
          border: 1px solid rgba(255,255,255,0.75);
          color: rgba(255,255,255,0.92);
          background: rgba(255,255,255,0.02);
          box-shadow: 0 0 0 rgba(255,255,255,0);
          transition: transform 120ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .btn-frame:hover {
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 28px rgba(255,255,255,0.10);
          transform: translateY(-1px);
        }
        .btn-frame:active {
          transform: translateY(0px) scale(0.99);
          box-shadow: 0 0 18px rgba(255,255,255,0.08);
        }

        .orbital {
          display: inline-block;
          animation: precess 18s linear infinite;
          transform-origin: 50% 50%;
          filter: drop-shadow(0 0 20px rgba(255,255,255,0.08));
        }
        @keyframes precess {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
