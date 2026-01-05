// src/app/calendar/page.tsx
import Link from "next/link";
import CalendarClient from "./ui/CalendarClient";

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
        borderColor: "rgba(31,36,26,0.18)",
        background: "rgba(244,235,221,0.62)",
        color: "rgba(31,36,26,0.88)",
        boxShadow: "0 10px 30px rgba(31,36,26,0.08)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(180deg, rgba(185,176,123,0.30) 0%, rgba(213,192,165,0.35) 55%, rgba(244,235,221,0.30) 120%)",
        }}
      />
      <span className="relative flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full opacity-70"
          style={{ background: "rgba(31,36,26,0.45)" }}
        />
        <span className="tracking-wide">{label}</span>
      </span>
    </Link>
  );
}

export default function CalendarPage() {
  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% -10%, rgba(244,235,221,0.55), rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(245,240,232,0.70), rgba(245,240,232,0.92))",
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline justify-between md:block">
            <div
              className="text-xs tracking-[0.28em] uppercase"
              style={{ color: "rgba(31,36,26,0.55)" }}
            >
              URA
            </div>
            <div
              className="mt-1 text-lg font-semibold tracking-tight"
              style={{ color: "rgba(31,36,26,0.90)" }}
            >
              Calendar
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {NAV.map((n) => (
              <NavPill key={n.href} href={n.href} label={n.label} />
            ))}
          </div>
        </div>

        <CalendarClient />
      </div>
    </div>
  );
}
