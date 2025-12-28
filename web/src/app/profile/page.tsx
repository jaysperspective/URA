// src/app/profile/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import { logoutAction } from "./actions";

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

function normDeg(v: number) {
  const x = v % 360;
  return x < 0 ? x + 360 : x;
}
function signFromLon(lon: number) {
  const d = normDeg(lon);
  return SIGNS[Math.floor(d / 30)] ?? "—";
}
function fmtLon(lon: number) {
  return `${normDeg(lon).toFixed(2)}°`;
}
function safeNum(v: any) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function pickName(user: any) {
  return (
    (typeof user?.name === "string" && user.name.trim()) ||
    (typeof user?.displayName === "string" && user.displayName.trim()) ||
    (typeof user?.email === "string" && user.email.split("@")[0]) ||
    "Profile"
  );
}

function getNatalSources(natal: any) {
  const planetsA = natal?.data?.planets;
  const ascA = natal?.data?.ascendant;

  const planetsB = natal?.natal?.bodies;
  const ascB = natal?.natal?.ascendant;

  return {
    planets: planetsA || planetsB || null,
    asc: safeNum(ascA ?? ascB),
  };
}

function getDerivedSummary(obj: any) {
  const summary = obj?.derived?.summary;
  if (!summary) return null;
  return {
    ascYearLabel: typeof summary.ascYearLabel === "string" ? summary.ascYearLabel : null,
    lunationLabel: typeof summary.lunationLabel === "string" ? summary.lunationLabel : null,
  };
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/85">
      {children}
    </span>
  );
}

function Card({
  title,
  kicker,
  right,
  children,
  className = "",
}: {
  title: string;
  kicker?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-3xl border border-white/12 bg-white/[0.06] shadow-[0_25px_90px_rgba(0,0,0,.28)] " +
        className
      }
    >
      <div className="flex items-start justify-between gap-3 px-6 pt-6">
        <div>
          {kicker ? (
            <div className="text-white/65 text-[11px] tracking-[0.18em] uppercase">{kicker}</div>
          ) : null}
          <div className="mt-2 text-lg font-semibold tracking-tight">{title}</div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <div className="px-6 pb-6 pt-4">{children}</div>
    </div>
  );
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await ensureProfileCaches(user.id);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#2D5128] text-white flex items-center justify-center px-6">
        <div className="text-white/80 text-sm">No profile found.</div>
      </div>
    );
  }

  if (!profile.setupDone) {
    return (
      <div className="min-h-screen bg-[#2D5128] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_25px_90px_rgba(0,0,0,.28)]">
            <div className="text-white/65 text-[11px] tracking-[0.18em] uppercase">Setup</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">Finish your profile</div>
            <div className="mt-3 text-white/75 text-sm">
              Add birth details and location so URA can generate your live cycle.
            </div>
            <div className="mt-6">
              <Link
                href="/profile/setup"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Continue
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tz = profile.timezone ?? "America/New_York";
  const locationLine = [profile.city, profile.state].filter(Boolean).join(", ") || tz;

  const natal = profile.natalChartJson as any;
  const ascYear = profile.ascYearJson as any;
  const lunation = profile.lunationJson as any;

  const { planets, asc } = getNatalSources(natal);

  const sunLon = safeNum(planets?.sun?.lon);
  const moonLon = safeNum(planets?.moon?.lon);
  const ascLon = safeNum(asc);

  const ascSummary = getDerivedSummary(ascYear);
  const lunaSummary = getDerivedSummary(lunation);

  const ascLabel =
    ascSummary?.ascYearLabel ||
    (typeof ascYear?.ascYear?.season === "string" && typeof ascYear?.ascYear?.modality === "string"
      ? `${ascYear.ascYear.season} · ${ascYear.ascYear.modality}`
      : "—");

  const lunLabel =
    lunaSummary?.lunationLabel ||
    (typeof lunation?.phase === "string"
      ? lunation.phase
      : typeof lunation?.lunation?.phase === "string"
        ? lunation.lunation.phase
        : "—");

  const ascParts =
    typeof ascLabel === "string" && ascLabel.includes("·")
      ? ascLabel.split("·").map((s: string) => s.trim()).filter(Boolean)
      : ascLabel
        ? [ascLabel]
        : ["—"];

  const name = pickName(user);

  // Full planet list
  const planetOrder: Array<[string, string]> = [
    ["sun", "Sun"],
    ["moon", "Moon"],
    ["mercury", "Mercury"],
    ["venus", "Venus"],
    ["mars", "Mars"],
    ["jupiter", "Jupiter"],
    ["saturn", "Saturn"],
    ["uranus", "Uranus"],
    ["neptune", "Neptune"],
    ["pluto", "Pluto"],
    ["chiron", "Chiron"],
  ];

  const planetRows = planetOrder
    .map(([key, label]) => {
      const lon = safeNum(planets?.[key]?.lon);
      if (lon == null) return null;
      return { key, label, lon, sign: signFromLon(lon), deg: fmtLon(lon) };
    })
    .filter(Boolean) as Array<{ key: string; label: string; lon: number; sign: string; deg: string }>;

  const ascRow =
    ascLon != null
      ? { label: "Ascendant", sign: signFromLon(ascLon), deg: fmtLon(ascLon) }
      : null;

  return (
    <div className="min-h-screen bg-[#2D5128] text-white">
      {/* Ambient layers */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),rgba(0,0,0,0)_55%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0)_55%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-white/65 text-[11px] tracking-[0.18em] uppercase">URA</div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Edit
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        {/* Main layout: left identity column + right live panels */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT: identity */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/12 bg-white/[0.06] shadow-[0_25px_90px_rgba(0,0,0,.28)] overflow-hidden">
              {/* Hero header */}
              <div className="p-7">
                <div className="text-4xl font-semibold tracking-tight">{name}</div>
                <div className="mt-2 text-white/70 text-sm">{locationLine}</div>

                {/* Key triad */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge>
                    Sun:{" "}
                    {sunLon != null ? (
                      <>
                        {signFromLon(sunLon)} {fmtLon(sunLon)}
                      </>
                    ) : (
                      "—"
                    )}
                  </Badge>
                  <Badge>
                    Moon:{" "}
                    {moonLon != null ? (
                      <>
                        {signFromLon(moonLon)} {fmtLon(moonLon)}
                      </>
                    ) : (
                      "—"
                    )}
                  </Badge>
                  <Badge>
                    Asc:{" "}
                    {ascLon != null ? (
                      <>
                        {signFromLon(ascLon)} {fmtLon(ascLon)}
                      </>
                    ) : (
                      "—"
                    )}
                  </Badge>
                </div>

                {/* Quick actions */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    href="/chart"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                  >
                    Chart
                  </Link>
                  <Link
                    href="/seasons"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                  >
                    Seasons
                  </Link>
                  <Link
                    href="/lunation"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                  >
                    Lunation
                  </Link>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10" />

              {/* Natal placements: compact list */}
              <div className="p-7">
                <div className="text-white/65 text-[11px] tracking-[0.18em] uppercase">Natal placements</div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ascRow ? (
                    <div className="rounded-2xl border border-white/12 bg-black/20 p-4">
                      <div className="text-sm font-medium text-white/90">{ascRow.label}</div>
                      <div className="mt-1 text-sm text-white/70">
                        {ascRow.sign} <span className="text-white/40">•</span> {ascRow.deg}
                      </div>
                    </div>
                  ) : null}

                  {planetRows.map((r) => (
                    <div key={r.key} className="rounded-2xl border border-white/12 bg-black/20 p-4">
                      <div className="text-sm font-medium text-white/90">{r.label}</div>
                      <div className="mt-1 text-sm text-white/70">
                        {r.sign} <span className="text-white/40">•</span> {r.deg}
                      </div>
                    </div>
                  ))}

                  {!ascRow && planetRows.length === 0 ? (
                    <div className="rounded-2xl border border-white/12 bg-black/20 p-4 text-white/70 text-sm">
                      Natal data not available yet.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: live cycle panels */}
          <div className="lg:col-span-7 space-y-4">
            <Card
              kicker="Current cycle"
              title="Ascendant Year"
              right={
                <div className="flex flex-wrap gap-2">
                  {ascParts.map((p) => (
                    <Badge key={p}>{p}</Badge>
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/12 bg-black/20 p-4">
                  <div className="text-white/60 text-xs tracking-wide uppercase">Focus</div>
                  <div className="mt-2 text-white/85 text-sm">
                    Seasonal placement and modality—used to pace your personal year.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/12 bg-black/20 p-4">
                  <div className="text-white/60 text-xs tracking-wide uppercase">Next</div>
                  <div className="mt-2 text-white/85 text-sm">
                    This panel will later include your upcoming boundaries and timing.
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/seasons"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                >
                  Open seasons
                </Link>
              </div>
            </Card>

            <Card
              kicker="Today"
              title="Lunation"
              right={<Badge>{String(lunLabel)}</Badge>}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/12 bg-black/20 p-4">
                  <div className="text-white/60 text-xs tracking-wide uppercase">Signal</div>
                  <div className="mt-2 text-white/85 text-sm">
                    Your daily rhythm marker—used to tune mood, timing, and momentum.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/12 bg-black/20 p-4">
                  <div className="text-white/60 text-xs tracking-wide uppercase">Next</div>
                  <div className="mt-2 text-white/85 text-sm">
                    This will later show phase transitions and short-form guidance.
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/lunation"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                >
                  Open lunation
                </Link>
              </div>
            </Card>

            {/* Workspace row: readings + journal (main hub future) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card kicker="URA" title="Readings">
                <div className="rounded-2xl border border-white/12 bg-black/20 p-4">
                  <div className="text-white/80 text-sm">
                    Your ontology-driven interpretations will render here as cards:
                  </div>
                  <ul className="mt-3 space-y-2 text-white/70 text-sm list-disc pl-5">
                    <li>Natal synthesis</li>
                    <li>Current cycle guidance</li>
                    <li>Timing windows</li>
                    <li>Action prompts</li>
                  </ul>
                </div>

                <div className="mt-4">
                  <button
                    disabled
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/50 cursor-not-allowed"
                  >
                    Coming soon
                  </button>
                </div>
              </Card>

              <Card kicker="Daily" title="Journal">
                <div className="rounded-2xl border border-white/12 bg-black/20 p-4">
                  <div className="text-white/80 text-sm">
                    Journal entries will live here—tagged by cycle and date.
                  </div>
                  <div className="mt-3 text-white/70 text-sm">
                    The composer + history view will replace this placeholder.
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    disabled
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/50 cursor-not-allowed"
                  >
                    Coming soon
                  </button>
                </div>
              </Card>
            </div>

            {/* Debug */}
            <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-5">
              <details>
                <summary className="cursor-pointer select-none text-white/65 text-[11px] tracking-[0.18em] uppercase">
                  Debug
                </summary>
                <div className="mt-4 rounded-2xl border border-white/12 bg-black/20 p-4 overflow-auto">
                  <pre className="text-xs text-white/70 whitespace-pre">
{JSON.stringify(
  {
    asOfDate: profile.asOfDate,
    dailyUpdatedAt: profile.dailyUpdatedAt,
    natalUpdatedAt: profile.natalUpdatedAt,
  },
  null,
  2
)}
                  </pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

