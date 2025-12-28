// src/app/profile/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import { logoutAction } from "./actions";

function fmtDateMDY(y: number, m: number, d: number) {
  return `${m}/${d}/${y}`;
}

function fmtTimeHM(h: number, min: number) {
  const hh = String(h).padStart(2, "0");
  const mm = String(min).padStart(2, "0");
  return `${hh}:${mm}`;
}

function safeNum(v: any) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getSummaryLabel(obj: any) {
  // Prefer new core-derived summary fields if present
  const summary = obj?.derived?.summary;
  if (!summary) return null;

  return {
    ascYearLabel: typeof summary.ascYearLabel === "string" ? summary.ascYearLabel : null,
    lunationLabel: typeof summary.lunationLabel === "string" ? summary.lunationLabel : null,
    ascYearCyclePos: safeNum(summary.ascYearCyclePos),
    ascYearDegreesInto: safeNum(summary.ascYearDegreesInto),
    lunationSeparation: safeNum(summary.lunationSeparation),
  };
}

export default async function ProfilePage() {
  const user = await requireUser();

  const profile = await ensureProfileCaches(user.id);
  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/70 text-sm">No profile found.</div>
      </div>
    );
  }

  // If setup isn’t done, send them to setup
  if (!profile.setupDone) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-lg px-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xl font-semibold">Finish profile setup</div>
            <div className="text-white/70 text-sm mt-2">
              Add your birth details + location so we can generate your living chart.
            </div>
            <div className="mt-5">
              <Link
                href="/profile/setup"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Go to setup
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const birthYear = profile.birthYear ?? null;
  const birthMonth = profile.birthMonth ?? null;
  const birthDay = profile.birthDay ?? null;
  const birthHour = profile.birthHour ?? null;
  const birthMinute = profile.birthMinute ?? null;

  const city = profile.city ?? null;
  const state = profile.state ?? null;
  const tz = profile.timezone ?? "America/New_York";

  const natal = profile.natalChartJson as any;
  const ascYear = profile.ascYearJson as any;
  const lunation = profile.lunationJson as any;

  const natalSun = safeNum(natal?.data?.planets?.sun?.lon ?? natal?.natal?.bodies?.sun?.lon);
  const natalMoon = safeNum(natal?.data?.planets?.moon?.lon ?? natal?.natal?.bodies?.moon?.lon);
  const natalAsc = safeNum(natal?.data?.ascendant ?? natal?.natal?.ascendant);

  const ascSummary = getSummaryLabel(ascYear);
  const lunaSummary = getSummaryLabel(lunation);

  const ascLabel =
    ascSummary?.ascYearLabel ||
    (typeof ascYear?.ascYear?.season === "string" && typeof ascYear?.ascYear?.modality === "string"
      ? `${ascYear.ascYear.season} · ${ascYear.ascYear.modality}`
      : null);

  const lunLabel =
    lunaSummary?.lunationLabel ||
    (typeof lunation?.phase === "string" ? lunation.phase : typeof lunation?.lunation?.phase === "string" ? lunation.lunation.phase : null);

  const birthLine =
    birthYear && birthMonth && birthDay && birthHour != null && birthMinute != null
      ? `${fmtDateMDY(birthYear, birthMonth, birthDay)} • ${fmtTimeHM(birthHour, birthMinute)} • ${tz}`
      : `Birth data incomplete • ${tz}`;

  const placeLine = [city, state].filter(Boolean).join(", ") || "Location not set";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Page shell */}
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-white/60 text-xs tracking-wide uppercase">Profile</div>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">Your living chart</h1>
            <p className="text-white/60 text-sm mt-2">
              Stored once. Updates as the date moves.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Edit
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        {/* Birth card */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-white/50 text-xs tracking-wide uppercase">Birth data</div>
          <div className="mt-2 text-base">{birthLine}</div>
          <div className="mt-1 text-white/60 text-sm">{placeLine}</div>
        </div>

        {/* Two-up cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-white/50 text-xs tracking-wide uppercase">Asc year</div>
            <div className="mt-2 text-xl font-semibold">Asc Year</div>
            <div className="mt-2 text-white/70 text-sm">
              {ascLabel ? (
                <>
                  <div>{ascLabel}</div>
                  {typeof ascSummary?.ascYearCyclePos === "number" ? (
                    <div className="mt-1 text-white/50">
                      Cycle position: {ascSummary.ascYearCyclePos.toFixed(2)}°
                      {typeof ascSummary.ascYearDegreesInto === "number" ? (
                        <> • Into modality: {ascSummary.ascYearDegreesInto.toFixed(2)}°</>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-1 text-white/50">Auto-refreshes once per day ({tz}).</div>
                  )}
                </>
              ) : (
                <div className="text-white/50 text-sm">Not generated yet.</div>
              )}
            </div>

            <div className="mt-4">
              <Link
                href="/seasons"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Open seasons
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-white/50 text-xs tracking-wide uppercase">Lunation</div>
            <div className="mt-2 text-xl font-semibold">Current lunation</div>
            <div className="mt-2 text-white/70 text-sm">
              {lunLabel ? (
                <>
                  <div>{lunLabel}</div>
                  {typeof lunaSummary?.lunationSeparation === "number" ? (
                    <div className="mt-1 text-white/50">
                      Separation: {lunaSummary.lunationSeparation.toFixed(2)}°
                    </div>
                  ) : (
                    <div className="mt-1 text-white/50">Refreshed daily based on your profile anchor.</div>
                  )}
                </>
              ) : (
                <div className="text-white/50 text-sm">Not generated yet.</div>
              )}
            </div>

            <div className="mt-4">
              <Link
                href="/lunation"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                Open lunation
              </Link>
            </div>
          </div>
        </div>

        {/* Natal */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-white/50 text-xs tracking-wide uppercase">Natal chart</div>
              <div className="mt-2 text-white/80 text-sm">
                {typeof natalSun === "number" ? <>Sun: {natalSun.toFixed(2)}°</> : <>Sun: —</>}
                <span className="mx-3 text-white/20">•</span>
                {typeof natalMoon === "number" ? <>Moon: {natalMoon.toFixed(2)}°</> : <>Moon: —</>}
                <span className="mx-3 text-white/20">•</span>
                {typeof natalAsc === "number" ? <>Asc: {natalAsc.toFixed(2)}°</> : <>Asc: —</>}
              </div>
              <div className="mt-1 text-white/50 text-sm">
                Natal is cached after first compute. It only resets if you edit birth data.
              </div>
            </div>

            <Link
              href="/chart"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Open chart
            </Link>
          </div>
        </div>

        {/* Debug (collapsed, so it doesn’t wreck layout) */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <details>
            <summary className="cursor-pointer select-none text-white/60 text-xs tracking-wide uppercase">
              Stored outputs (debug)
            </summary>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 overflow-auto">
                <div className="text-white/50 text-xs mb-2">Profile meta</div>
                <pre className="text-xs text-white/70 whitespace-pre">
{JSON.stringify(
  {
    dailyUpdatedAt: profile.dailyUpdatedAt,
    natalUpdatedAt: profile.natalUpdatedAt,
    asOfDate: profile.asOfDate,
  },
  null,
  2
)}
                </pre>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4 overflow-auto">
                <div className="text-white/50 text-xs mb-2">Asc year JSON</div>
                <pre className="text-xs text-white/70 whitespace-pre">
{JSON.stringify(ascYear, null, 2)}
                </pre>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4 overflow-auto">
                <div className="text-white/50 text-xs mb-2">Lunation JSON</div>
                <pre className="text-xs text-white/70 whitespace-pre">
{JSON.stringify(lunation, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
