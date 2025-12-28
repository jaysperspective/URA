// src/app/profile/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import { requireUser } from "@/lib/auth/requireUser";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default async function ProfilePage() {
  // ✅ must be authed
  const user = await requireUser();
  if (!user) redirect("/login");

  // ✅ hard gate BEFORE ensureProfileCaches so we never trigger asc-year while incomplete
  const baseProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: {
      setupDone: true,
      birthLat: true,
      birthLon: true,
      birthYear: true,
      birthMonth: true,
      birthDay: true,
      birthHour: true,
      birthMinute: true,
      timezone: true,
      city: true,
      state: true,
      birthPlace: true,
    },
  });

  const hasBirth =
    !!baseProfile?.setupDone &&
    typeof baseProfile.birthYear === "number" &&
    typeof baseProfile.birthMonth === "number" &&
    typeof baseProfile.birthDay === "number" &&
    typeof baseProfile.birthHour === "number" &&
    typeof baseProfile.birthMinute === "number" &&
    typeof baseProfile.birthLat === "number" &&
    typeof baseProfile.birthLon === "number";

  if (!hasBirth) {
    redirect("/profile/setup");
  }

  // ✅ safe: caches won't run unless we have full birth + coordinates
  const profile = await ensureProfileCaches(user.id);
  if (!profile) redirect("/profile/setup");

  // defensive: if something cleared coords after cache call
  if (profile.birthLat == null || profile.birthLon == null) {
    redirect("/profile/setup");
  }

  const tz = profile.timezone || "America/New_York";

  const birthLabel =
    profile.birthYear != null &&
    profile.birthMonth != null &&
    profile.birthDay != null &&
    profile.birthHour != null &&
    profile.birthMinute != null
      ? `${profile.birthMonth}/${profile.birthDay}/${profile.birthYear} • ${pad2(
          profile.birthHour
        )}:${pad2(profile.birthMinute)} • ${tz}`
      : "Birth data missing";

  const placeLabel =
    profile.birthPlace ||
    (profile.city || profile.state
      ? `${profile.city ?? ""}${profile.city && profile.state ? ", " : ""}${profile.state ?? ""}`
      : "") ||
    (profile.birthLat != null && profile.birthLon != null
      ? `${profile.birthLat.toFixed(3)}, ${profile.birthLon.toFixed(3)}`
      : "");

  const asc = profile.ascYearJson as any;
  const luna = profile.lunationJson as any;
  const natal = profile.natalChartJson as any;

  const sunLon = natal?.data?.planets?.sun?.lon;
  const moonLon = natal?.data?.planets?.moon?.lon;
  const ascLon = natal?.data?.ascendant;

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8">
          <div className="text-sm text-neutral-400">Profile</div>
          <h1 className="text-3xl font-semibold tracking-tight">Your living chart</h1>
          <div className="mt-2 text-sm text-neutral-400">
            Stored once. Updates as the date moves.
          </div>
        </header>

        <div className="grid gap-6">
          {/* Identity */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-400">
                  Birth data
                </div>
                <div className="mt-2 text-lg">{birthLabel}</div>
                {placeLabel ? (
                  <div className="mt-1 text-sm text-neutral-400">{placeLabel}</div>
                ) : null}
              </div>

              <a
                href="/profile/setup"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-neutral-200 hover:bg-black/40"
              >
                Edit
              </a>
            </div>
          </section>

          {/* Asc Year + Lunation */}
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                Asc Year
              </div>

              <div className="mt-3 text-xl font-semibold">
                {asc?.label || asc?.phaseName || "Asc Year"}
              </div>

              <div className="mt-2 text-sm text-neutral-300 space-y-1">
                {asc?.season ? <div>Season: {asc.season}</div> : null}
                {asc?.modality ? <div>Modality: {asc.modality}</div> : null}
                {asc?.phaseIndex != null ? <div>Phase: {asc.phaseIndex}</div> : null}
                {asc?.degIntoPhase != null ? (
                  <div>
                    Degrees in: {Number(asc.degIntoPhase).toFixed?.(2)}°
                  </div>
                ) : null}
              </div>

              <div className="mt-4 text-xs text-neutral-500">
                Auto-refreshes once per day ({tz}).
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                Lunation
              </div>

              <div className="mt-3 text-xl font-semibold">
                {luna?.label || luna?.phase || "Current lunation"}
              </div>

              <div className="mt-2 text-sm text-neutral-300 space-y-1">
                {luna?.phase ? <div>Phase: {luna.phase}</div> : null}
                {luna?.separationDeg != null ? (
                  <div>
                    Separation: {Number(luna.separationDeg).toFixed?.(2)}°
                  </div>
                ) : null}
                {luna?.cycle ? <div>Cycle: {luna.cycle}</div> : null}
                {luna?.season ? <div>Seasonal tone: {luna.season}</div> : null}
              </div>

              <div className="mt-4 text-xs text-neutral-500">
                Refreshed daily based on your profile date anchor.
              </div>
            </section>
          </div>

          {/* Natal summary + link out */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-400">
                  Natal chart
                </div>

                <div className="mt-3 grid gap-2 text-sm text-neutral-300">
                  <div>
                    Sun: {typeof sunLon === "number" ? `${sunLon.toFixed(2)}°` : "—"}
                  </div>
                  <div>
                    Moon:{" "}
                    {typeof moonLon === "number" ? `${moonLon.toFixed(2)}°` : "—"}
                  </div>
                  <div>
                    Asc: {typeof ascLon === "number" ? `${ascLon.toFixed(2)}°` : "—"}
                  </div>
                </div>

                <div className="mt-3 text-xs text-neutral-500">
                  Natal is cached after first compute. It only resets if you edit birth
                  data.
                </div>
              </div>

              <a
                href="/chart"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-neutral-200 hover:bg-black/40"
              >
                Open chart
              </a>
            </div>
          </section>

          {/* Debug block (optional) */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-400">
              Stored outputs (debug)
            </div>
            <pre className="mt-3 text-xs text-neutral-200 overflow-auto">
              {JSON.stringify(
                {
                  dailyUpdatedAt: profile.dailyUpdatedAt,
                  natalUpdatedAt: profile.natalUpdatedAt,
                  asOfDate: profile.asOfDate,
                  ascYearJson: profile.ascYearJson,
                  lunationJson: profile.lunationJson,
                },
                null,
                2
              )}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
