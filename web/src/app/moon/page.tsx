// src/app/moon/page.tsx
import MoonClient from "./ui/MoonClient";
import { NAV, NavPill } from "@/lib/ui/nav";
import MoonCalendarNavButton from "./ui/MoonCalendarNavButton";

export default function MoonPage() {
  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% -10%, rgba(210,225,255,0.10), rgba(0,0,0,0) 60%), linear-gradient(180deg, #050814 0%, #070B17 55%, #040612 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline justify-between md:block">
            <div
              className="text-xs tracking-[0.28em] uppercase"
              style={{ color: "rgba(248,244,238,0.55)" }}
            >
              URA
            </div>
            <div
              className="mt-1 text-lg font-semibold tracking-tight"
              style={{ color: "rgba(248,244,238,0.92)" }}
            >
              Moon
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* ✅ Calendar icon now lives in the nav bar */}
            <MoonCalendarNavButton />

            {NAV.map((n) => (
              <NavPill
                key={n.href}
                href={n.href}
                label={n.label}
                active={n.href === "/moon"}
              />
            ))}
          </div>
        </div>

        <MoonClient />
      </div>
    </div>
  );
}

