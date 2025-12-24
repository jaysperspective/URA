// src/app/page.tsx

import Link from "next/link";

export default function IntroPage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: "#333131" }}
    >
      <main className="flex flex-col items-center justify-center gap-12 px-6 text-center text-white">

        {/* Title */}
        <h1
          className="text-4xl sm:text-5xl tracking-[0.35em] font-light"
        >
          URA&nbsp;&nbsp;ASTRO&nbsp;&nbsp;SYSTEM
        </h1>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mt-4">

          <Link
            href="/signup"
            className="px-10 py-4 border border-white/80 tracking-[0.3em] text-sm hover:bg-white hover:text-[#333131] transition"
          >
            SIGN&nbsp;UP
          </Link>

          <Link
            href="/login"
            className="px-10 py-4 border border-white/80 tracking-[0.3em] text-sm hover:bg-white hover:text-[#333131] transition"
          >
            LOG&nbsp;IN
          </Link>

        </div>

        {/* About */}
        <Link
          href="/about"
          className="mt-2 px-12 py-4 border border-white/80 tracking-[0.3em] text-sm hover:bg-white hover:text-[#333131] transition"
        >
          ABOUT&nbsp;THIS&nbsp;SYSTEM
        </Link>

        {/* Orbital symbol */}
        <div className="mt-20 opacity-80">
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
            />
            <ellipse
              cx="130"
              cy="130"
              rx="120"
              ry="45"
              transform="rotate(-25 130 130)"
              stroke="white"
              strokeWidth="1"
            />
          </svg>
        </div>

      </main>
    </div>
  );
}
