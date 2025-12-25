// src/app/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Star = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number; // alpha
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function Page() {
  // --- audio reactive (OFF by default) ---
  const [audioEnabled, setAudioEnabled] = useState(false);

  // --- canvas constellation ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // animation state held in refs (no rerenders)
  const starsRef = useRef<Star[]>([]);
  const lastTRef = useRef<number>(0);

  // audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);

  // subtle “energy” used to modulate constellation brightness/connection
  const audioEnergyRef = useRef<number>(0);

  // seed count scales with viewport (but capped)
  const starCount = useMemo(() => {
    if (typeof window === "undefined") return 90;
    const area = window.innerWidth * window.innerHeight;
    return clamp(Math.floor(area / 14000), 70, 140);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      // TS-safe: canvas exists here
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // TS-safe: ctx exists here
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ensureStars() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const existing = starsRef.current;

      if (existing.length > 0) return;

      const next: Star[] = [];
      for (let i = 0; i < starCount; i++) {
        const r = Math.random() * 1.35 + 0.35; // tiny points
        const baseSpeed = 0.012; // ultra subtle
        next.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r,
          vx: (Math.random() - 0.5) * baseSpeed,
          vy: (Math.random() - 0.5) * baseSpeed,
          a: Math.random() * 0.35 + 0.12,
        });
      }
      starsRef.current = next;
    }

    function tick(t: number) {
      const w = window.innerWidth;
      const h = window.innerHeight;

      const last = lastTRef.current || t;
      const dt = Math.min(32, t - last);
      lastTRef.current = t;

      ensureStars();

      // audio energy is 0..1 (very small effect)
      const energy = audioEnergyRef.current;

      // background is already #333131 via CSS below; we just clear w/ transparent
      ctx.clearRect(0, 0, w, h);

      const stars = starsRef.current;

      // drift
      for (const s of stars) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        if (s.x < -20) s.x = w + 20;
        if (s.x > w + 20) s.x = -20;
        if (s.y < -20) s.y = h + 20;
        if (s.y > h + 20) s.y = -20;
      }

      // draw points
      for (const s of stars) {
        // subtle pulse: slightly increases alpha with energy
        const a = clamp(s.a + energy * 0.12, 0, 0.55);

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      // optional connections (ultra subtle)
      // distance threshold increases slightly with energy
      const maxD = 92 + energy * 28;
      const maxD2 = maxD * maxD;

      for (let i = 0; i < stars.length; i++) {
        const a = stars[i];
        for (let j = i + 1; j < stars.length; j++) {
          const b = stars[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / maxD) * (0.07 + energy * 0.08);
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [starCount]);

  // --- Audio analyser (off by default; user must toggle) ---
  useEffect(() => {
    let stop = false;

    async function startAudio() {
      try {
        // Create AudioContext only when enabled
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx: AudioContext = new AudioCtx();
        audioCtxRef.current = audioCtx;

        // Mic input
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (stop) return;

        const src = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024; // low-frequency vibe
        analyser.smoothingTimeConstant = 0.85;

        src.connect(analyser);
        analyserRef.current = analyser;

        // IMPORTANT: keep this typed as a plain Uint8Array
        // (fixes TS generic ArrayBufferLike issues on some TS/lib combos)
        freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
          const an = analyserRef.current;
          const arr = freqDataRef.current;

          if (!audioEnabled || stop || !an || !arr) {
            audioEnergyRef.current = lerp(audioEnergyRef.current, 0, 0.08);
            requestAnimationFrame(loop);
            return;
          }

          // TS-safe: some builds complain about generics; this keeps it stable
          an.getByteFrequencyData(arr as unknown as Uint8Array);

          // low band energy: first ~12%
          const n = Math.max(8, Math.floor(arr.length * 0.12));
          let sum = 0;
          for (let i = 0; i < n; i++) sum += arr[i];

          const avg = sum / (n * 255); // 0..1
          const eased = Math.pow(avg, 1.4); // softer response

          // keep it subtle
          audioEnergyRef.current = lerp(audioEnergyRef.current, eased, 0.07);

          requestAnimationFrame(loop);
        };

        loop();
      } catch {
        // if mic denied, just keep it off
        setAudioEnabled(false);
      }
    }

    function stopAudio() {
      audioEnergyRef.current = 0;

      const audioCtx = audioCtxRef.current;
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
      freqDataRef.current = null;
    }

    if (audioEnabled) startAudio();
    else stopAudio();

    return () => {
      stop = true;
      stopAudio();
    };
  }, [audioEnabled]);

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-[#333131] text-white">
      {/* Constellation canvas (ultra subtle) */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      />

      {/* Soft vignette */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_35%,rgba(0,0,0,0.0)_70%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.25)_65%,rgba(0,0,0,0.35)_100%)]" />

      {/* Audio toggle */}
      <button
        type="button"
        onClick={() => setAudioEnabled((v) => !v)}
        className="absolute right-6 top-6 z-10 rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-[11px] tracking-[0.25em] uppercase text-white/80 hover:bg-white/10"
      >
        AUDIO · {audioEnabled ? "ON" : "OFF"}
      </button>

      {/* Center content */}
      <main className="relative z-10 flex min-h-[100svh] items-center justify-center px-6">
        <div className="w-full max-w-5xl">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            {/* Compressed toward center by tightening padding/margins */}
            <h1 className="mt-2 text-[46px] leading-none tracking-[0.32em] sm:text-[64px]">
              URA&nbsp;&nbsp;ASTRO&nbsp;&nbsp;SYSTEM
            </h1>

            <div className="mt-6 text-[11px] tracking-[0.42em] text-white/55">
              AN ORIENTATION ENGINE FOR CYCLES, TIMING, AND MEANING
            </div>

            {/* Box buttons (kept) */}
            <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <Link
                href="/signup"
                className="rounded-none border border-white/55 bg-transparent px-14 py-4 text-[12px] tracking-[0.38em] text-white/90 hover:bg-white/10"
              >
                SIGN&nbsp;&nbsp;UP
              </Link>

              <Link
                href="/login"
                className="rounded-none border border-white/55 bg-transparent px-14 py-4 text-[12px] tracking-[0.38em] text-white/90 hover:bg-white/10"
              >
                LOG&nbsp;&nbsp;IN
              </Link>
            </div>

            <div className="mt-6">
              <Link
                href="/about"
                className="inline-block rounded-none border border-white/55 bg-transparent px-16 py-4 text-[12px] tracking-[0.38em] text-white/90 hover:bg-white/10"
              >
                ABOUT&nbsp;&nbsp;THIS&nbsp;&nbsp;SYSTEM
              </Link>
            </div>

            {/* Dynamic Saturn mark */}
            <div className="mt-14">
              <DynamicSaturn energyRef={audioEnergyRef} />
            </div>

            <div className="mt-10 text-[10px] tracking-[0.35em] text-white/35">
              ENTER QUIETLY · OBSERVE PRECISELY
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DynamicSaturn({ energyRef }: { energyRef: React.RefObject<number> }) {
  // tiny, slow “breathing” + optional audio influence
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf: number;
    const loop = (now: number) => {
      setT(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const energy = energyRef.current ?? 0;

  // gentle modulation
  const breathe = (Math.sin(t / 2200) + 1) / 2; // 0..1
  const scale = 1 + breathe * 0.02 + energy * 0.03;
  const rot = -10 + breathe * 4 + energy * 8;

  return (
    <div
      className="mx-auto"
      style={{
        width: 260,
        height: 260,
        transform: `scale(${scale}) rotate(${rot}deg)`,
        transition: "transform 120ms linear",
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 260 260" className="h-full w-full">
        <defs>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.55 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* planet */}
        <circle
          cx="130"
          cy="140"
          r="72"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1.6"
          filter="url(#softGlow)"
        />

        {/* ring 1 (animated dash) */}
        <ellipse
          cx="130"
          cy="145"
          rx="112"
          ry="46"
          fill="none"
          stroke="rgba(255,255,255,0.70)"
          strokeWidth="1.6"
          strokeDasharray="6 10"
          className="saturnRing saturnRingA"
          filter="url(#softGlow)"
        />

        {/* ring 2 (solid, offset) */}
        <ellipse
          cx="130"
          cy="145"
          rx="100"
          ry="40"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.1"
          className="saturnRing saturnRingB"
        />

        {/* occulting arc to fake depth (front ring segment brighter) */}
        <path
          d="M 34 145 C 70 112, 190 112, 226 145"
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.8"
          filter="url(#softGlow)"
        />

        <style jsx>{`
          .saturnRing {
            transform-origin: 130px 145px;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
          .saturnRingA {
            animation-name: ringDriftA;
            animation-duration: 18s;
          }
          .saturnRingB {
            animation-name: ringDriftB;
            animation-duration: 26s;
          }
          @keyframes ringDriftA {
            0% {
              transform: rotate(-28deg);
              stroke-dashoffset: 0;
            }
            100% {
              transform: rotate(-28deg);
              stroke-dashoffset: -220;
            }
          }
          @keyframes ringDriftB {
            0% {
              transform: rotate(-28deg);
              opacity: 0.35;
            }
            50% {
              transform: rotate(-28deg);
              opacity: 0.55;
            }
            100% {
              transform: rotate(-28deg);
              opacity: 0.35;
            }
          }
        `}</style>
      </svg>
    </div>
  );
}
