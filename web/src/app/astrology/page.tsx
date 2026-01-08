// src/app/astrology/page.tsx
import AstrologyClient from "./ui/AstrologyClient";
import { NAV, NavPill } from "@/lib/ui/nav";

export default function AstrologyPage() {
  return (
    <main
      className="min-h-screen"
      style={{
        // ✅ NO BLACK — green-only depth
        background:
          "radial-gradient(1400px 700px at 50% -200px, rgba(84,138,98,0.55) 0%, rgba(36,62,46,0.85) 45%, rgba(22,38,28,0.95) 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Nav */}
        <nav className="mb-8 flex flex-wrap gap-2">
          {NAV.map((item) => (
            <NavPill
              key={item.href}
              href={item.href}
              label={item.label}
              active={item.href === "/astrology"}
            />
          ))}
        </nav>

        {/* Header */}
        <header className="mb-6">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "rgba(244,235,221,0.92)" }}
          >
            URA Astrology
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(244,235,221,0.72)" }}>
            Type a placement like <strong>Mars in Virgo 6th house</strong> or{" "}
            <strong>North Node Aquarius 11</strong>.
          </p>
        </header>

        <AstrologyClient />
      </div>
    </main>
  );
}
