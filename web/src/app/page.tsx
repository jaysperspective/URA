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
    const speed = 0.004 + Math.random() * 0.01; // very slow
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
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
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

    ctxRef.current = ctx;

    function resize() {
      const c = canvasRef.current;
      const cctx = ctxRef.current;
      if (!c || !cctx) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;

      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ensureStars() {
      const base = window.innerWidth * window.innerHeight;
      const count = Math.max(70, Math.min(190, Math.floor(base / 12000)));
      if (!starsRef.current.length) starsRef.current = makeStars(count);
    }

    let last = performance.now();

    function step(now: number) {
      const c = canvasRef.current;
      const cctx = ctxRef.current;
      if (!c || !cctx) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ensureStars();
      const stars = starsRef.current;

      const lvl = audioEnabled ? audioLevel : 0;
      const twinkleBoost = 1 + lvl * 0.8;

      cctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

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

        const tw = 0.85 + 0.15 * Math.sin(now / 1200 + s.tw) * twinkleBoost;
        const a = Math.max(0, Math.min(1, s.a * tw));

        cctx.beginPath();
        cctx.arc(x, y, s.r, 0, Math.PI * 2);
        cctx.fillStyle = `rgba(255,255,255,${a})`;
        cctx.fill();
      }

      // Constellation lines (subtle)
      const maxLinks = 70;
      const linkDist = 135 + lvl * 60;
      let links = 0;

      cctx.lineWidth = 1;
      cctx.strokeStyle = `rgba(255,255,255,${0.03 + lvl * 0.05})`;

      for (let i = 0; i < stars.length && links < maxLinks; i++) {
        const a = stars[i];
        const ax = a.x * window.innerWidth + px;
        const ay = a.y * window.innerHeight + py;

        for (let j = i + 1; j < stars.length && links < maxLinks; j += 6) {
          const b = stars[j];
          const bx = b.x * window.innerWidth + px;
          const by = b.y * window.innerHeight + py;
          const dx = ax - bx;
          const dy = ay - by;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            const t = 1 - d / linkDist;
            const alpha = (0.02 + lvl * 0.06) * t;
            if (alpha < 0.01) continue;

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
    }

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctxRef.current = null;
    };
  }, [pos.x, pos.y, audioEnabled, audioLevel]);

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

      const AudioCtx =
        (window.AudioContext || (window as any).webkitAudioContext) as
          | typeof AudioContext
          | undefined;

      if (!AudioCtx) throw new Error("AudioContext not supported");

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.9;

      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount
