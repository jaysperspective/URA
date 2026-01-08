// src/app/astrology/page.tsx
import AstrologyClient from "./ui/AstrologyClient";
import { NAV, NavPill } from "@/lib/ui/nav";

export default function AstrologyPage() {
  return (
    <main className="min-h-screen">
      {/* Top Navigation (neutral) */}
      <div className="mx-auto max-w-5xl px-4 py-6">
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

        {/* Page Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            URA Astrology
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "rgba(244,235,221,0.75)" }}
          >
            Type a placement like <strong>Mars in Virgo 6th house</strong> or{" "}
            <strong>North Node Aquarius 11</strong>.
          </p>
        </header>
      </div>

      {/* 🌿 Astrology Environment */}
      <section
        className="mx-auto max-w-5xl px-4 pb-16"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -200px, rgba(44, 76, 54, 0.55), rgba(6, 10, 8, 0.95))",
        }}
      >
        <AstrologyClient />
      </section>
    </main>
  );
}
