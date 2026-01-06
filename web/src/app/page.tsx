// src/app/page.tsx
import Link from "next/link";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/calendar", label: "Calendar" },
  { href: "/moon", label: "Moon" },
  { href: "/profile", label: "Profile" },
  { href: "/lunation", label: "Lunation" },
  { href: "/about", label: "About" },
] as const;

function NavPill({
  href,
  label,
  active,
}: {
  href: (typeof NAV)[number]["href"];
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-full border px-4 py-2 text-sm transition"
      style={{
        borderColor: active ? "rgba(31,36,26,0.30)" : "rgba(31,36,26,0.18)",
        background: active ? "rgba(244,235,221,0.80)" : "rgba(244,235,221,0.62)",
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
          style={{ background: active ? "rgba(31,36,26,0.60)" : "rgba(31,36,26,0.45)" }}
        />
        <span className="tracking-wide">{label}</span>
      </span>
    </Link>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl border p-6 md:p-8"
      style={{
        borderColor: "rgba(31,36,26,0.16)",
        background: "rgba(244,235,221,0.86)",
        boxShadow: "0 18px 50px rgba(31,36,26,0.10)",
      }}
    >
      {children}
    </div>
  );
}

function ActionLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border px-5 py-4 transition"
      style={{
        borderColor: "rgba(31,36,26,0.16)",
        background: "rgba(248,242,232,0.86)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold" style={{ color: "rgba(31,36,26,0.92)" }}>
            {title}
          </div>
          <div className="mt-1 text-sm" style={{ color: "rgba(31,36,26,0.70)" }}>
            {desc}
          </div>
        </div>

        <div
          className="mt-0.5 rounded-full border px-3 py-1 text-xs"
          style={{
            borderColor: "rgba(31,36,26,0.16)",
            color: "rgba(31,36,26,0.70)",
            background: "rgba(244,235,221,0.62)",
          }}
        >
          Open
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const pageBg =
    "radial-gradient(1200px 700px at 50% -10%, rgba(244,235,221,0.55), rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(245,240,232,0.70), rgba(245,240,232,0.92))";

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline justify-between md:block">
            <div className="text-xs tracking-[0.28em] uppercase" style={{ color: "rgba(31,36,26,0.55)" }}>
              URA
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "rgba(31,36,26,0.90)" }}>
              Home
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {NAV.map((n) => (
              <NavPill key={n.href} href={n.href} label={n.label} active={n.href === "/"} />
            ))}
          </div>
        </div>

        {/* Hero */}
        <CardShell>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
                Temporal–Ecological Orientation
              </div>

              <div className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: "rgba(31,36,26,0.92)" }}>
                Truth is knowing what time it is.
              </div>

              <div className="mt-3 text-sm md:text-[15px]" style={{ color: "rgba(31,36,26,0.72)", lineHeight: 1.6 }}>
                URA is a daily compass. Not prediction. Not personality typing.
                It restores temporal literacy: recognizing the phase you’re in, and choosing the right mode of engagement.
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/profile"
                  className="rounded-full border px-4 py-2 text-sm"
                  style={{
                    borderColor: "rgba(31,36,26,0.20)",
                    background: "rgba(31,36,26,0.92)",
                    color: "rgba(244,235,221,0.96)",
                    boxShadow: "0 12px 34px rgba(31,36,26,0.18)",
                  }}
                >
                  Open my orientation
                </Link>

                <Link
                  href="/about"
                  className="rounded-full border px-4 py-2 text-sm"
                  style={{
                    borderColor: "rgba(31,36,26,0.18)",
                    background: "rgba(244,235,221,0.62)",
                    color: "rgba(31,36,26,0.88)",
                  }}
                >
                  Read the doctrine
                </Link>

                <Link
                  href="/calendar"
                  className="rounded-full border px-4 py-2 text-sm"
                  style={{
                    borderColor: "rgba(31,36,26,0.18)",
                    background: "rgba(244,235,221,0.62)",
                    color: "rgba(31,36,26,0.88)",
                  }}
                >
                  View the cycle
                </Link>
              </div>
            </div>

            {/* Right column: “Today” snapshot (non-data-dependent, but structured like the app) */}
            <div className="rounded-3xl border p-5 md:p-6" style={{ borderColor: "rgba(31,36,26,0.14)", background: "rgba(248,242,232,0.82)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
                    Daily Flow
                  </div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: "rgba(31,36,26,0.88)" }}>
                    Use URA in 3 steps
                  </div>
                </div>

                <div
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{ borderColor: "rgba(31,36,26,0.16)", color: "rgba(31,36,26,0.70)" }}
                >
                  Compass mode
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm" style={{ color: "rgba(31,36,26,0.74)" }}>
                <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "rgba(31,36,26,0.12)", background: "rgba(244,235,221,0.56)" }}>
                  <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)" }}>
                    1) Orientation
                  </div>
                  <div className="mt-1">
                    Check your Asc-Year phase (0–360°) and match behavior to timing.
                  </div>
                </div>

                <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "rgba(31,36,26,0.12)", background: "rgba(244,235,221,0.56)" }}>
                  <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)" }}>
                    2) Micro-cycle
                  </div>
                  <div className="mt-1">
                    Check progressed lunation: your inner season across longer development.
                  </div>
                </div>

                <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "rgba(31,36,26,0.12)", background: "rgba(244,235,221,0.56)" }}>
                  <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)" }}>
                    3) Witnessing
                  </div>
                  <div className="mt-1">
                    Convert experience into guidance. The output is clarity, not control.
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs" style={{ color: "rgba(31,36,26,0.60)" }}>
                URA doesn’t tell you what will happen. It helps you recognize what kind of time you’re in.
              </div>
            </div>
          </div>
        </CardShell>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <ActionLink href="/calendar" title="Calendar" desc="View the 8-phase cycle map and daily placement." />
          <ActionLink href="/profile" title="Profile" desc="Your personal orientation: Asc-Year phase + waveform + foundation." />
          <ActionLink href="/moon" title="Moon" desc="Lunar context and the emotional weather layer." />
          <ActionLink href="/lunation" title="Lunation" desc="Progressed lunation: longer-cycle timing for inner development." />
        </div>

        {/* Doctrine preview */}
        <div className="mt-5">
          <CardShell>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
                  Doctrine
                </div>
                <div className="mt-2 text-xl font-semibold tracking-tight" style={{ color: "rgba(31,36,26,0.92)" }}>
                  A Temporal–Ecological System for Human Orientation
                </div>
                <div className="mt-3 text-sm" style={{ color: "rgba(31,36,26,0.72)", lineHeight: 1.6 }}>
                  URA is a timing instrument. It treats time as a living process and restores phase-appropriate behavior:
                  emergence, establishment, differentiation, bonding, assertion, transformation, dissolution, witnessing.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/about"
                  className="rounded-full border px-4 py-2 text-sm"
                  style={{
                    borderColor: "rgba(31,36,26,0.18)",
                    background: "rgba(31,36,26,0.92)",
                    color: "rgba(244,235,221,0.96)",
                  }}
                >
                  Read /about
                </Link>
                <Link
                  href="/seasons"
                  className="rounded-full border px-4 py-2 text-sm"
                  style={{
                    borderColor: "rgba(31,36,26,0.18)",
                    background: "rgba(244,235,221,0.62)",
                    color: "rgba(31,36,26,0.88)",
                  }}
                >
                  View /seasons
                </Link>
              </div>
            </div>
          </CardShell>
        </div>

        <div className="mt-6 text-center text-xs" style={{ color: "rgba(31,36,26,0.55)" }}>
          URA • private daily compass • time-as-process
        </div>
      </div>
    </div>
  );
}
