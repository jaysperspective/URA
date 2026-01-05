// src/app/moon/page.tsx
import Link from "next/link";
import MoonClient from "./ui/MoonClient";

const NAV = [
  { href: "/calendar", label: "Calendar" },
  { href: "/moon", label: "Moon" },
  { href: "/profile", label: "Profile" },
  { href: "/lunation", label: "Lunation" },
] as const;

function NavPill({
  href,
  label,
}: {
  href: (typeof NAV)[number]["href"];
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-full border px-4 py-2 text-sm transition"
      style={{
        borderColor: "rgba(255,255,255,0.16)",
        background: "rgba(248,244,238,0.10)",
        color: "rgba(248,244,238,0.92)",
        boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(248,244,238,0.06) 60%, rgba(0,0,0,0) 120%)",
        }}
      />
      <span className="relative flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full opacity-80"
          style={{ background: "rgba(248,244,238,0.80)" }}
        />
        <span className="tracking-wide">{label}</span>
      </span>
    </Link>
  );
}

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
            {NAV.map((n) => (
              <NavPill key={n.href} href={n.href} label={n.label} />
            ))}
          </div>
        </div>

        <MoonClient />
      </div>
    </div>
  );
}
