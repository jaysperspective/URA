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
  const idx = Math.floor(d / 30);
  return SIGNS[Math.max(0, Math.min(11, idx))];
}

function fmtLon(lon: number) {
  return `${normDeg(lon).toFixed(2)}°`;
}

function safeNum(v: any) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function pickName(user: any) {
  // Adjust based on your User model fields.
  // Common patterns: name, displayName, email.
  return (
    (typeof user?.name === "string" && user.name.trim()) ||
    (typeof user?.displayName === "string" && user.displayName.trim()) ||
    (typeof user?.email === "string" && user.email.split("@")[0]) ||
    "Profile"
  );
}

function pill(text: string) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white/85">
      {text}
    </span>
  );
}

function getDerivedSummary(obj: any) {
  const summary = obj?.derived?.summary;
  if (!summary) return null;

  return {
    ascYearLabel: typeof summary.ascYearLabel === "string" ? summary.ascYearLabel : null,
    lunationLabel: typeof summary.lunationLabel === "string" ? summary.lunationLabel : null,
  };
}

function getNatalSources(natal: any) {
  // Support both astro-service and any alternate shapes
  const planetsA = natal?.data?.planets;
  const ascA = natal?.data?.ascendant;

  const planetsB = natal?.natal?.bodies;
  const ascB = natal?.natal?.ascendant;

  return {
    planets: planetsA || planetsB || null,
    asc: safeNum(ascA ?? ascB),
  };
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
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,.35)]">
            <div className="text-xl font-semibold tracking-tight">Finish setup</div>
            <div className="text-white/75 text-sm mt-2">
              Add your birth details and location to generate your profile.
            </div>
            <div className="mt-5">
              <Link
                href="/profile/setup"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
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

  // Pull key natal points
  const sunLon = safeNum(planets?.sun?.lon);
  const moonLon = safeNum(planets?.moon?.lon);
  const ascLon = safeNum(asc);

  const headerName = pickName(user);

  // Asc Year + Lunation labels (prefer derived summary)
  const ascSummary = getDerivedSummary(ascYear);
  const lunaSummary = getDerivedSummary(lunation);

  const ascLabel =
    ascSummary?.ascYearLabel ||
    (typeof ascYear?.ascYear?.season === "string" && typeof ascYear?.ascYear?.modality === "string"
      ? `${ascYear.ascYear.season} · ${ascYear.ascYear.modality}`
      : null);

  const lunLabel =
    lunaSummary?.lunationLabel ||
    (typeof lunation?.phase === "string"
      ? lunation.phase
      : typeof lunation?.lunation?.phase === "string"
        ? lunation.lunation.phase
        : null);

  const ascParts = typeof ascLabel === "string" && ascLabel.includes("·")
    ? ascLabel.split("·").map((s: string) => s.trim()).filter(Boolean)
    : ascLabel
      ? [ascLabel]
      : [];

  // Planet list (full natal)
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
    ["nn", "North Node"],
    ["sn", "South Node"],
  ];

  const planetRows = planetOrder
    .map(([key, label]) => {
      const lon = safeNum(planets?.[key]?.lon);
      if (lon == null) return null;
      return { key, label, lon, sign: signFromLon(lon), deg: fmtLon(lon) };
    })
    .filter(Boolean) as Array<{ key: string; label: string; lon: number; sign: string; deg: string }>;

  // Include Ascendant if present
  const ascRow =
    ascLon != null
      ? { label: "Ascendant", sign: signFromLon(ascLon), deg: fmtLon(ascLon) }
      : null;

  return (
    <div className="min-h-screen bg-[#2D5128] text-white">
      {/* Soft top vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),rgba(0,0,0,0)_55%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-white/70 text-xs tracking-[0.18em] uppercase">Profile</div>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight truncate">
              {headerName}
            </h1>

            {/* Sun / Moon / Asc right under name */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/85">
              {sunLon != null ? pill(`Sun: ${signFromLon(sunLon)} ${fmtLon(sunLon)}`) : pill("Sun: —")}
              {moonLon != null ? pill(`Moon: ${signFromLon(moonLon)} ${fmtLon(moonLon)}`) : pill("Moon: —")}
              {ascLon != null ? pill(`Asc: ${signFromLon(ascLon)} ${fmtLon(ascLon)}`) : pill("Asc: —")}
            </div>

            <div className="mt-2 text-white/70 text-sm truncate">{locationLine}</div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Edit
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        {/* Top grid: Asc Year / Lunation */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,.25)]">
            <div className="text-white/70 text-xs tracking-[0.18em] uppercase">Asc Year</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {ascParts.length ? ascParts.map((p) => pill(p)) : pill("—")}
            </div>

            <div className="mt-5">
              <Link
                href="/seasons"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Open seasons
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,.25)]">
            <div className="text-white/70 text-xs tracking-[0.18em] uppercase">Lunation</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {lunLabel ? pill(String(lunLabel)) : pill("—")}
            </div>

            <div className="mt-5">
              <Link
                href="/lunation"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Open lunation
              </Link>
            </div>
          </div>
        </div>

        {/* Natal: full planet list + chart button */}
        <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,.25)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-white/70 text-xs tracking-[0.18em] uppercase">Natal</div>
              <div className="mt-2 text-lg font-semibold">Planet placements</div>
            </div>

            <Link
              href="/chart"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Open chart
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {ascRow ? (
              <div className="rounded-xl border border-white/15 bg-black/20 p-4">
                <div className="text-white/85 text-sm font-medium">{ascRow.label}</div>
                <div className="mt-1 text-white/70 text-sm">
                  {ascRow.sign} <span className="text-white/50">•</span> {ascRow.deg}
                </div>
              </div>
            ) : null}

            {planetRows.map((r) => (
              <div key={r.key} className="rounded-xl border border-white/15 bg-black/20 p-4">
                <div className="text-white/85 text-sm font-medium">{r.label}</div>
                <div className="mt-1 text-white/70 text-sm">
                  {r.sign} <span className="text-white/50">•</span> {r.deg}
                </div>
              </div>
            ))}

            {!ascRow && planetRows.length === 0 ? (
              <div className="rounded-xl border border-white/15 bg-black/20 p-4 text-white/70 text-sm">
                Natal data not available yet.
              </div>
            ) : null}
          </div>
        </div>

        {/* Dynamic sections: Readings + Journal placeholders */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,.25)]">
            <div className="text-white/70 text-xs tracking-[0.18em] uppercase">Readings</div>
            <div className="mt-2 text-lg font-semibold">URA interpretation</div>
            <div className="mt-3 text-white/70 text-sm">
              This space is reserved for your ontology-driven LLM readings (Asc Year, Lunation, Natal synthesis, timing).
            </div>

            <div className="mt-5">
              <button
                disabled
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/50 cursor-not-allowed"
              >
                Coming soon
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,.25)]">
            <div className="text-white/70 text-xs tracking-[0.18em] uppercase">Journal</div>
            <div className="mt-2 text-lg font-semibold">Daily notes</div>
            <div className="mt-3 text-white/70 text-sm">
              This space will hold your entries and reflections tied to your current cycle.
            </div>

            <div className="mt-5">
              <button
                disabled
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/50 cursor-not-allowed"
              >
                Coming soon
              </button>
            </div>
          </div>
        </div>

        {/* Debug (still available, not in the way) */}
        <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.06] p-5">
          <details>
            <summary className="cursor-pointer select-none text-white/65 text-xs tracking-[0.18em] uppercase">
              Debug
            </summary>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-white/15 bg-black/20 p-4 overflow-auto">
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
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
