// src/app/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Star = {
  x: number;
  y: number;
  r: number;
  a: number; // alpha
  vx: number;
  vy: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Page() {
  // --- audio vibe (OFF by default) ---
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqRef = useRef<Uint8Array | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafAudioRef = useRef<number | null>(null);

  // --- constellation canvas ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafStarsRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const dprRef = useRef(1);

  const palette = useMemo(
    () => ({
      bg: "#333131",
      ink: "rgba(255,255,255,0.92)",
      inkSoft: "rgba(255,255,255,0.65)",
      inkFaint: "rgba(255,255,255,0.18)",
      inkGhost: "rgba(255,255,255,0.08)",
    }),
    []
  );

  // -------- Audio setup / teardown --------
  async function enableAudio() {
    try {
      // Must be user-gesture initiated (button click)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx() as AudioContext;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024; // low-frequency vibe
      analyser.smoothingTimeConstant = 0.85;

      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);

      // TypedArray generics in newer TS can be annoyingly strict in DOM signatures.
      // Force it to the expected Uint8Array shape.
      const data = new Uint8Array(analyser.frequencyBinCount) as unknown as Uint8Array;

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      freqRef.current = data;
      mediaStreamRef.current = stream;

      // loop
      const tick = () => {
        const an = analyserRef.current;
        const arr = freqRef.current;
        if (!an || !arr) {
          setAudioLevel(0);
          rafAudioRef.current = requestAnimationFrame(tick);
          return;
        }

        an.getByteFrequencyData(arr);

        // Low band energy (first ~12%)
        const n = Math.max(8, Math.floor(arr.length * 0.12));
        let sum = 0;
        for (let i = 0; i < n; i++) sum += arr[i];
        const avg = sum / n; // 0..255

        // Map to 0..1 with a very gentle response
        const level = clamp((avg - 8) / 110, 0, 1);
        setAudioLevel(level);

        rafAudioRef.current = requestAnimationFrame(tick);
      };

      if (rafAudioRef.current) cancelAnimationFrame(rafAudioRef.current);
      rafAudioRef.current = requestAnimationFrame(tick);
    } catch {
      // if mic denied, keep OFF
      setAudioEnabled(false);
      setAudioLevel(0);
    }
  }

  function disableAudio() {
    setAudioLevel(0);

    if (rafAudioRef.current) {
      cancelAnimationFrame(rafAudioRef.current);
      rafAudioRef.current = null;
    }

    if (analyserRef.current) analyserRef.current.disconnect();
    analyserRef.current = null;

    if (audioCtxRef.current) {
      // best-effort close
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    freqRef.current = null;
  }

  useEffect(() => {
    if (audioEnabled) enableAudio();
    else disableAudio();

    return () => {
      disableAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled]);

  // -------- Constellation Canvas --------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      dprRef.current = dpr;

      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // transform is global to context
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ensureStars() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // subtle density
      const target = Math.floor((w * h) / 26000); // ~60ish on 1440p
      const current = starsRef.current.length;

      if (current < target) {
        const add = target - current;
        for (let i = 0; i < add; i++) {
          starsRef.current.push(makeStar(w, h));
        }
      } else if (current > target) {
        starsRef.current = starsRef.current.slice(0, target);
      }
    }

    function makeStar(w: number, h: number): Star {
      const r = Math.random() < 0.15 ? 1.3 : 1.0;
      const a = 0.08 + Math.random() * 0.18; // ultra subtle
      const speed = 0.012 + Math.random() * 0.02;
      const angle = Math.random() * Math.PI * 2;

      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r,
        a,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
    }

    function step() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ensureStars();

      // clear
      ctx.clearRect(0, 0, w, h);

      // draw points
      const stars = starsRef.current;

      // Slight audio influence (still subtle): brighten + a tiny drift increase
      const vibe = audioEnabled ? audioLevel : 0;
      const brightBoost = vibe * 0.08;

      for (const s of stars) {
        // move
        const drift = 1 + vibe * 0.35;
        s.x += s.vx * drift;
        s.y += s.vy * drift;

        // wrap
        if (s.x < -5) s.x = w + 5;
        if (s.x > w + 5) s.x = -5;
        if (s.y < -5) s.y = h + 5;
        if (s.y > h + 5) s.y = -5;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${clamp(s.a + brightBoost, 0.05, 0.30)})`;
        ctx.fill();
      }

      // a few faint “constellation” links (random neighbors)
      // only a handful, and very low opacity
      const linkCount = Math.min(18, Math.floor(stars.length * 0.18));
      for (let i = 0; i < linkCount; i++) {
        const aIdx = Math.floor(Math.random() * stars.length);
        const bIdx = Math.floor(Math.random() * stars.length);
        if (aIdx === bIdx) continue;

        const A = stars[aIdx];
        const B = stars[bIdx];

        const dx = A.x - B.x;
        const dy = A.y - B.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 180) continue;

        const alpha = clamp(0.02 + (1 - dist / 180) * 0.04 + vibe * 0.02, 0.02, 0.07);

        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      rafStarsRef.current = requestAnimationFrame(step);
    }

    resize();
    ensureStars();

    window.addEventListener("resize", resize);
    rafStarsRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafStarsRef.current) cancelAnimationFrame(rafStarsRef.current);
      rafStarsRef.current = null;
    };
  }, [audioEnabled, audioLevel]);

  return (
    <div className="page">
      {/* constellation layer */}
      <canvas ref={canvasRef} className="stars" aria-hidden="true" />

      {/* audio toggle */}
      <button
        type="button"
        className="audioToggle"
        onClick={() => setAudioEnabled((v) => !v)}
        aria-pressed={audioEnabled}
        title={audioEnabled ? "Audio vibe is ON" : "Audio vibe is OFF"}
      >
        AUDIO · {audioEnabled ? "ON" : "OFF"}
      </button>

      <main className="shell">
        <div className="stack">
          <header className="hero">
            <div className="kicker">URA</div>
            <h1 className="title">URA&nbsp;&nbsp;ASTRO&nbsp;&nbsp;SYSTEM</h1>
            <p className="subtitle">AN ORIENTATION ENGINE FOR CYCLES, TIMING, AND MEANING</p>
          </header>

          <div className="actions">
            <Link className="btn" href="/signup">
              SIGN&nbsp;&nbsp;UP
            </Link>

            <Link className="btn" href="/login">
              LOG&nbsp;&nbsp;IN
            </Link>
          </div>

          <div className="aboutRow">
            <Link className="btn wide" href="/about">
              ABOUT&nbsp;&nbsp;THIS&nbsp;&nbsp;SYSTEM
            </Link>
          </div>

          {/* Saturn mark */}
          <div
            className="saturnWrap"
            style={{
              filter: `drop-shadow(0 0 ${10 + audioLevel * 22}px rgba(255,255,255,${
                0.07 + audioLevel * 0.07
              }))`,
            }}
            aria-hidden="true"
          >
            <div className="saturnMark">
              <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="260" y2="260" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="rgba(255,255,255,0.95)" />
                    <stop offset="0.5" stopColor="rgba(255,255,255,0.55)" />
                    <stop offset="1" stopColor="rgba(255,255,255,0.90)" />
                  </linearGradient>

                  <linearGradient id="planetGrad" x1="60" y1="60" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="rgba(255,255,255,0.85)" />
                    <stop offset="1" stopColor="rgba(255,255,255,0.60)" />
                  </linearGradient>
                </defs>

                <g className="saturnPlanet">
                  <circle cx="130" cy="136" r="78" stroke="url(#planetGrad)" strokeWidth="1.15" opacity="0.92" />
                  <path
                    d="M62 136c18-16 44-25 68-25s50 9 68 25"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                  />
                  <path
                    d="M62 136c18 16 44 25 68 25s50-9 68-25"
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth="1"
                  />
                </g>

                <g className="saturnRings" transform="rotate(-24 130 130)">
                  <ellipse cx="130" cy="130" rx="126" ry="44" stroke="url(#ringGrad)" strokeWidth="1.1" opacity="0.86" />
                  <ellipse
                    cx="130"
                    cy="130"
                    rx="102"
                    ry="34"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="1"
                    opacity="0.55"
                  />
                  <ellipse
                    cx="130"
                    cy="130"
                    rx="112"
                    ry="38"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="6"
                    opacity="0.18"
                  />

                  <g className="saturnGlints" opacity="0.6">
                    <circle cx="245" cy="122" r="1.4" fill="rgba(255,255,255,0.85)" />
                    <circle cx="38" cy="148" r="1.1" fill="rgba(255,255,255,0.65)" />
                    <circle cx="210" cy="92" r="0.9" fill="rgba(255,255,255,0.55)" />
                  </g>
                </g>
              </svg>
            </div>
          </div>

          <footer className="footer">ENTER QUIETLY · OBSERVE PRECISELY</footer>
        </div>
      </main>

      <style jsx>{`
        .page {
          position: relative;
          min-height: 100svh;
          background: ${palette.bg};
          overflow: hidden;
        }

        /* soft vignette + center lift */
        .page::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(1100px 520px at 50% 22%, rgba(255, 255, 255, 0.07), transparent 60%),
            radial-gradient(900px 700px at 50% 70%, rgba(255, 255, 255, 0.035), transparent 62%),
            radial-gradient(1200px 900px at 50% 50%, rgba(0, 0, 0, 0.0), rgba(0, 0, 0, 0.25));
          pointer-events: none;
          z-index: 0;
        }

        .stars {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .audioToggle {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 3;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(0, 0, 0, 0.18);
          color: rgba(255, 255, 255, 0.82);
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
        }

        .audioToggle:hover {
          background: rgba(0, 0, 0, 0.28);
          border-color: rgba(255, 255, 255, 0.42);
          transform: translateY(-1px);
        }

        .shell {
          position: relative;
          z-index: 2;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 72px 20px;
        }

        /* compressed toward center */
        .stack {
          width: 100%;
          max-width: 980px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 26px;
          transform: translateY(-18px);
        }

        .hero {
          text-align: center;
        }

        .kicker {
          font-size: 12px;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 10px;
        }

        .title {
          margin: 0;
          font-size: clamp(44px, 6vw, 72px);
          letter-spacing: 0.22em;
          font-weight: 500;
          color: ${palette.ink};
        }

        .subtitle {
          margin: 16px 0 0;
          font-size: 12px;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.46);
        }

        .actions {
          display: flex;
          gap: 24px;
          margin-top: 10px;
        }

        .aboutRow {
          margin-top: 4px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 54px;
          min-width: 220px;
          padding: 0 26px;
          border: 1px solid rgba(255, 255, 255, 0.45);
          color: rgba(255, 255, 255, 0.88);
          text-decoration: none;
          border-radius: 0; /* crisp */
          font-size: 12px;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.12);
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, opacity 140ms ease;
        }

        .btn:hover {
          background: rgba(0, 0, 0, 0.20);
          border-color: rgba(255, 255, 255, 0.65);
          transform: translateY(-1px);
        }

        .btn:active {
          transform: translateY(0px);
          opacity: 0.92;
        }

        .btn.wide {
          min-width: 520px;
        }

        .saturnWrap {
          margin-top: 14px;
        }

        .saturnMark {
          opacity: 0.88;
          transform: translateY(2px);
        }

        .footer {
          margin-top: 4px;
          font-size: 11px;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.28);
        }

        /* Saturn motion */
        .saturnPlanet {
          transform-origin: 50% 50%;
          animation: planetBreath 6.5s ease-in-out infinite;
        }

        .saturnRings {
          transform-origin: 50% 50%;
          animation: ringPrecess 16s linear infinite;
        }

        .saturnGlints {
          transform-origin: 50% 50%;
          animation: glintDrift 7.5s ease-in-out infinite;
        }

        @keyframes planetBreath {
          0% {
            opacity: 0.86;
            transform: translateY(0px) scale(1);
          }
          50% {
            opacity: 0.98;
            transform: translateY(-1px) scale(1.006);
          }
          100% {
            opacity: 0.86;
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes ringPrecess {
          0% {
            transform: rotate(-24deg);
          }
          100% {
            transform: rotate(336deg);
          }
        }

        @keyframes glintDrift {
          0% {
            transform: translateX(0px) translateY(0px);
            opacity: 0.35;
          }
          50% {
            transform: translateX(2px) translateY(-1px);
            opacity: 0.75;
          }
          100% {
            transform: translateX(0px) translateY(0px);
            opacity: 0.35;
          }
        }

        @media (max-width: 640px) {
          .actions {
            flex-direction: column;
            gap: 14px;
          }
          .btn,
          .btn.wide {
            min-width: min(520px, 88vw);
          }
          .stack {
            transform: translateY(-8px);
            gap: 22px;
          }
        }
      `}</style>
    </div>
  );
}
