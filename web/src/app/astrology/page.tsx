// src/app/astrology/page.tsx
import AstrologyClient from "./ui/AstrologyClient";
import { NAV, NavPill } from "@/lib/ui/nav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AstrologyPage() {
  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{
        background:
          "radial-gradient(1400px 700px at 50% -200px, rgba(84,138,98,0.55) 0%, rgba(36,62,46,0.85) 55%, rgba(16,24,19,0.92) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* TOP BAR */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline justify-between md:block">
            <div className="text-xs tracking-[0.28em] uppercase" style={{ color: "rgba(220,232,223,0.65)" }}>
              URA
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "rgba(244,239,230,0.92)" }}>
              Astrology
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {NAV.map((n) => (
              <NavPill key={n.href} href={n.href} label={n.label} active={n.href === "/astrology"} />
            ))}
          </div>
        </div>

        <AstrologyClient />
      </div>
    </main>
  );
}
