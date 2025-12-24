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
    const r = 0.6 + Math.random() * 1.3; // tiny
    const a = 0.10 + Math.random() * 0.22; // ultra subtle
    const speed = 0.003 + Math.random() * 0.008; // very slow drift
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

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export default function IntroPage() {
  // pointer parallax
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });

  // audio-reactive (off by default)
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0..1

  // canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);

  // audio nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const audioRafRef = useRef<number | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const x = clamp01(e.clientX / window.innerWidth);
      const y = clamp01(e.clientY / window.innerHeight);
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

  // Constellation canvas init + animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    ctxRef.current = ctx;

    const resize = () => {
      const c = canvasRef.current;
      const cctx = ctxRef.current;
      if (!c || !cctx) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ensureStars = () => {
      if (starsRef.current.length) return;
      const area = window.innerWidth * window.innerHeight;
      const count = Math.max(70, Math.min(190, Math.floor(area / 12000)));
      starsRef.current = makeStars(count);
    };

    let last = performance.now();

    const step = (now: number) => {
      const cctx = ctxRef.current;
      if (!cctx) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ensureStars();
      const stars = starsRef.current;

      const lvl = audioEnabled ? audioLevel : 0;
      const twinkleBoost = 1 + lvl * 0.7;

      cctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Parallax offset for starfield
      const px = (pos.x - 0.5) * 14;
      const py = (pos.y - 0.5) * 14;

      // Stars
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

        const tw = 0.9 + 0.1 * Math.sin(now / 1400 + s.tw) * twinkleBoost;
        const a = clamp01(s.a * tw);

        cctx.beginPath();
        cctx.arc(x, y, s.r, 0, Math.PI * 2);
        cctx.fillStyle = `rgba(255,255,255,${a})`;
        cctx.fill();
      }

      // Constellation links (VERY subtle)
      const maxLinks = 60;
      const linkDist = 125 + lvl * 50;
      let links = 0;

      for (let i = 0; i < stars.length && links < maxLinks; i++) {
        const a = stars[i];
        const ax = a.x * window.innerWidth + px;
        const ay = a.y * window.innerHeight + py;

        for (let j = i + 1; j < stars.length && links < maxLinks; j += 7) {
          const b = stars[j];
          const bx = b.x * window.innerWidth + px;
          const by = b.y * window.innerHeight + py;

          const dx = ax - bx;
          const dy = ay - by;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < linkDist) {
            const t = 1 - d / linkDist;
            const alpha = (0.012 + lvl * 0.05) * t;
            if (alpha < 0.008) continue;

            cctx.lineWidth = 1;
            cctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            cctx.beginPath();
            cctx.moveTo(ax, ay);
            cctx.lineTo(bx, by);
            cctx.stroke();
            links++;
          }
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      ctxRef.current = null;
    };
  }, [pos.x, pos.y, audioEnabled, audioLevel]);

  // AUDIO enable/disable
  const enableAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const AudioCtx =
        (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) ??
        null;

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
      mediaStreamRef.current = stream;
      dataRef.current = data;

      setAudioEnabled(true);

      const tick = () => {
        const an = analyserRef.current;
        const arr = dataRef.current;
        if (!an || !arr) return;

        an.getByteFrequencyData(arr);

        // low band energy
        const n = Math.max(8, Math.floor(arr.length * 0.12));
        let sum = 0;
        for (let i = 0; i < n; i++) sum += arr[i];
        const avg = sum / n / 255; // 0..1

        // compress + keep subtle
        const lvl = clamp01(Math.pow(avg, 0.85));
        setAudioLevel(lvl);

        audioRafRef.current = requestAnimationFrame(tick);
      };

      audioRafRef.current = requestAnimationFrame(tick);
    } catch {
      // denied/unavailable: remain off
      setAudioEnabled(false);
      setAudioLevel(0);
    }
  };

  const disableAudio = () => {
    setAudioEnabled(false);
    setAudioLevel(0);

    if (audioRafRef.current) cancelAnimationFrame(audioRafRef.current);
    audioRafRef.current = null;

    // stop mic tracks
    const stream = mediaStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    mediaStreamRef.current = null;

    // close audio ctx
    const ctx = audioCtxRef.current;
    if (ctx) {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    dataRef.current = null;
  };

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden text-white" style={{ backgroundColor: BG }}>
      {/* Constellation field */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" />

      {/* Ambient vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(900px 520px at 50% 30%, rgba(255,255,255,0.10), rgba(0,0,0,0) 60%), radial-gradient(1200px 700px at 50% 110%, rgba(255,255,255,0.05), rgba(0,0,0,0) 60%)",
          transform: `translate(${drift.dx * 0.25}px, ${drift.dy * 0.25}px)`,
          transition: "transform 120ms ease-out",
        }}
      />

      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 z-[2] opacity-[0.10] mix-blend-overlay grain" />

      {/* Audio toggle */}
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

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link href="/signup" className={cx("btn-frame", "px-12 py-4 text-[12px] tracking-[0.35em] uppercase")}>
                SIGN&nbsp;UP
              </Link>

              <Link href="/login" className={cx("btn-frame", "px-12 py-4 text-[12px] tracking-[0.35em] uppercase")}>
                LOG&nbsp;IN
              </Link>
            </div>

            <div className="mt-6">
              <Link href="/about" className={cx("btn-frame", "px-16 py-4 text-[12px] tracking-[0.35em] uppercase")}>
                ABOUT&nbsp;THIS&nbsp;SYSTEM
              </Link>
            </div>

            <div
              className="mt-12 sm:mt-14 opacity-85"
              style={{
                transform: `translate(${drift.dx * 0.25}px, ${drift.dy * 0.25}px)`,
                transition: "transform 140ms ease-out",
                filter: `drop-shadow(0 0 ${14 + audioLevel * 22}px rgba(255,255,255,${
                  0.06 + audioLevel * 0.06
                }))`,
              }}
            >
              <div className="orbital" style={{ animationDuration: `${18 - audioLevel * 6}s` }}>
                <svg width="260" height="260" viewBox="0 0 260 260" fill="none" aria-hidden="true">
                  <circle cx="130" cy="130" r="90" stroke="white" strokeWidth="1" opacity="0.9" />
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
          background-image: radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0.5px, transparent 0.6px),
            radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.15) 0.5px, transparent 0.7px),
            radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.12) 0.5px, transparent 0.7px);
          background-size: 140px 140px, 180px 180px, 220px 220px;
          animation: grainMove 10s linear infinite;
        }
        @keyframes grainMove {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-140px, -140px, 0);
          }
        }

        .btn-frame {
          border: 1px solid rgba(255, 255, 255, 0.75);
          color: rgba(255, 255, 255, 0.92);
          background: rgba(255, 255, 255, 0.02);
          box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          transition: transform 120ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .btn-frame:hover {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 28px rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        .btn-frame:active {
          transform: translateY(0px) scale(0.99);
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.08);
        }

        .orbital {
          display: inline-block;
          animation-name: precess;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          transform-origin: 50% 50%;
        }
        @keyframes precess {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .audio-toggle {
          transition: transform 120ms ease, background 160ms ease, border-color 160ms ease;
        }
        .audio-toggle:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.28);
        }
        .audio-toggle:active {
          transform: translateY(0px) scale(0.99);
        }
      `}</style>
    </div>
  );
}
