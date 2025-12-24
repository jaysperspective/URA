// src/app/page.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

const BG = "#333131";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Star = {
  x: number; // 0..1
  y: number; // 0..1
  r: number; // px
  a: number; // alpha
  vx: number; // per second (norm units)
  vy: number; // per second (norm units)
  tw: number; // twinkle phase seed
};

function makeStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const r = 0.6 + Math.random() * 1.4; // tiny
    const a = 0.12 + Math.random() * 0.35; // subtle
    const speed = 0.004 + Math.random() * 0.010; // very slow
    const dir = Math.random() * Math.PI * 2;
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r,
      a,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      tw: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export default function IntroPage() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0..1

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const audioTickRef = useRef<number | null>(null);

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

  // Constellation canvas: init + animate
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ensureStars() {
      const base = window.innerWidth * window.innerHeight;
      const count = Math.max(70, Math.min(190, Math.floor(base / 12000))); // adaptive
      if (!starsRef.current.length) starsRef.current = makeStars(count);
    }

    let last = performance.now();

    function step(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ensureStars();
      const stars = starsRef.current;

      // audioLevel subtly modulates twinkle intensity & line visibility
      const lvl = audioEnabled ? audioLevel : 0;
      const twinkleBoost = 1 + lvl * 0.8;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Parallax offset for starfield
      const px = (pos.x - 0.5) * 16;
      const py = (pos.y - 0.5) * 16;

      // Draw stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // wrap
        if (s.x < -0.05) s.x = 1.05;
        if (s.x > 1.05) s.x = -0.05;
        if (s.y < -0.05) s.y = 1.05;
        if (s.y > 1.05) s.y = -0.05;

        const x = s.x * window.innerWidth + px;
        const y = s.y * window.innerHeight + py;

        // twinkle
        const tw = 0.85 + 0.15 * Math.sin(now / 1200 + s.tw) * twinkleBoost;
        const a = Math.max(0, Math.min(1, s.a * tw));

        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      // Draw sparse constellation lines (nearest-ish links under threshold)
      // Keep it extremely subtle, only a few per frame.
      const maxLinks = 70;
      const linkDist = 135 + lvl * 60; // px
      let links = 0;

      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.03 + lvl * 0.05})`;

      for (let i = 0; i < stars.length && links < maxLinks; i++) {
        const a = stars[i];
        const ax = a.x * window.innerWidth + px;
        const ay = a.y * window.innerHeight + py;

        // check a few neighbors (cheap)
        for (let j = i + 1; j < stars.length && links < maxLinks; j += 6) {
          const b = stars[j];
          const bx = b.x * window.innerWidth + px;
          const by = b.y * window.innerHeight + py;
          const dx = ax - bx;
          const dy = ay - by;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            // alpha falls off with distance
            const t = 1 - d / linkDist;
            const alpha = (0.02 + lvl * 0.06) * t;
            if (alpha < 0.01) continue;

            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
            links++;
          }
        }
      }

      rafRef.current = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pos.x, pos.y, audioEnabled, audioLevel]);

  // AUDIO: off by default, user toggles
  async function enableAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;

      if (!AudioCtx) throw new Error("AudioContext not supported");

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.9;

      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      srcRef.current = src;
      dataRef.current = data;

      setAudioEnabled(true);

      // Tick loop: low-frequency energy measure (bass / low mids)
      function tick() {
        const an = analyserRef.current;
        const arr = dataRef.current;
        if (!an || !arr) return;

        an.getByteFrequencyData(arr);

        // Take first ~12% bins as low-frequency band (approx)
        const n = Math.max(8, Math.floor(arr.length * 0.12));
        let sum = 0;
        for (let i = 0; i < n; i++) sum += arr[i];
        const avg = sum / n / 255; // 0..1

        // compress to subtle movement
        const lvl = Math.max(0, Math.min(1, Math.pow(avg, 0.8)));
        setAudioLevel(lvl);

        audioTickRef.current = window.requestAnimationFrame(tick);
      }

      audioTickRef.current = window.requestAnimationFrame(tick);
    } catch {
      // If denied/unavailable, just keep it off
      setAudioEnabled(false);
      setAudioLevel(0);
    }
  }

  function disableAudio() {
    setAudioEnabled(false);
    setAudioLevel(0);

    if (audioTickRef.current) cancelAnimationFrame(audioTickRef.current);
    audioTickRef.current = null;

    try {
      const ctx = audioCtxRef.current;
      if (ctx) ctx.close();
    } catch {
      // ignore
    }

    audioCtxRef.current = null;
    analyserRef.current = null;
    srcRef.current = null;
    dataRef.current = null;
  }

  return (
    <div
      className="relative min-h-[100svh] w-full overflow-hidden text-white"
      style={{ backgroundColor: BG }}
    >
      {/* Constellation field canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      />

      {/* Ambient vignette + subtle moving light */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(900px 520px at 50% 30%, rgba(255,255,255,0.10), rgba(0,0,0,0) 60%), radial-gradient(1200px 700px at 50% 110%, rgba(255,255,255,0.05), rgba(0,0,0,0) 60%)",
          transform: `translate(${drift.dx * 0.25}px, ${drift.dy * 0.25}px)`,
          transition: "transform 120ms ease-out",
        }}
      />

      {/* Film grain overlay */}
      <div className="pointer-events-none absolute inset-0 z-[2] opacity-[0.10] mix-blend-overlay grain" />

      {/* Top-right audio toggle (subtle, off by default) */}
      <div className="absolute right-4 top-4 z-[5]">
        <button
          onClick={() => (audioEnabled ? disableAudio() : enableAudio())}
          className={cx(
            "audio-toggle",
            "rounded-xl border border-white/20 bg-white/5 px-3 py-2",
            "text-[10px] tracking-[0.22em] uppercase text-white/70 hover:text-white"
          )}
        >
          {audioEnabled ? "Audio · On" : "Audio · Off"}
        </button>
      </div>

      {/* Content */}
      <main className="relative z-[3] flex min-h-[100svh] items-center justify-center px-6">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col items-center text-center">
            <h1 className="select-none text-[40px] sm:text-[54px] font-light tracking-[0.35em]">
              URA&nbsp;&nbsp;ASTRO&nbsp;&nbsp;SYSTEM
            </h1>

            <div className="mt-3 text-[12px] tracking-[0.28em] uppercase text-white/55">
              an orientation engine for cycles, timing, and meaning
            </div>

            {/* Buttons (boxed) */}
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/signup"
                className={cx("btn-frame", "px-12 py-4 text-[12px] tracking-[0.35em] uppercase")}
              >
                SIGN&nbsp;UP
              </Link>

              <Link
                href="/login"
                className={cx("btn-frame", "px-12 py-4 text-[12px] tracking-[0.35em] uppercase")}
              >
                LOG&nbsp;IN
              </Link>
            </div>

            <div className="mt-6">
              <Link
                href="/about"
                className={cx("btn-frame", "px-16 py-4 text-[12px] tracking-[0.35em] uppercase")}
              >
                ABOUT&nbsp;THIS&nbsp;SYSTEM
              </Link>
            </div>

            {/* Orbital symbol */}
            <div
              className="mt-12 sm:mt-14 opacity-85"
              style={{
                transform: `translate(${drift.dx * 0.25}px, ${drift.dy * 0.25}px)`,
                transition: "transform 140ms ease-out",
                // audio subtly expands orbital glow and rotation feel
                filter: `drop-shadow(0 0 ${14 + audioLevel * 22}px rgba(255,255,255,${
                  0.06 + audioLevel * 0.06
                }))`,
              }}
            >
              <div
                className="orbital"
                style={{
                  animationDuration: `${18 - audioLevel * 6}s`, // slightly faster with audio
                }}
              >
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
          animation-name: precess;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          transform-origin: 50% 50%;
        }
        @keyframes precess {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .audio-toggle {
          transition: transform 120ms ease, background 160ms ease, border-color 160ms ease;
        }
        .audio-toggle:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.28);
        }
        .audio-toggle:active {
          transform: translateY(0px) scale(0.99);
        }
      `}</style>
    </div>
  );
}
