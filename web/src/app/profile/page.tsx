// src/app/profile/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import { logoutAction } from "./actions";

const SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
] as const;

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

function normDeg(v: number) {
  const x = v % 360;
  return x < 0 ? x + 360 : x;
}
function safeNum(v: any) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function signFromLon(lon: number) {
  const d = normDeg(lon);
  return SIGNS[Math.floor(d / 30)] ?? "—";
}
function fmtDegMin(lon: number) {
  const d = normDeg(lon);
  const sign = signFromLon(d);
  const degInSign = d % 30;
  const deg = Math.floor(degInSign);
  const min = Math.round((degInSign - deg) * 60);
  const mm = String(min).padStart(2, "0");
  return `${deg}° ${sign.slice(0, 3)} ${mm}'`;
}
function degDeltaForward(fromLon: number, toLon: number) {
  const a = normDeg(fromLon);
  const b = normDeg(toLon);
  const d = b - a;
  return d >= 0 ? d : d + 360;
}
function estimateDaysUntil(deltaDeg: number) {
  return deltaDeg / 0.9856;
}
function addDaysISO(isoLike: string, days: number) {
  const d = new Date(isoLike);
  if (!Number.isFinite(d.getTime())) return null;
  return new Date(d.getTime() + days * 86400000).toISOString();
}
function fmtLocalDateTime(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function pickDisplayName(user: any, profile: any) {
  const u = (typeof profile?.username === "string" && profile.username.trim()) || "";
  if (u) return u;

  const n = (typeof user?.name === "string" && user.name.trim()) || "";
  if (n) return n;

  const e = (typeof user?.email === "string" && user.email.trim()) || "";
  if (e) return e.split("@")[0] || e;

  return "Profile";
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

function getAscYearSlice(ascYearJson: any) {
  const ay = ascYearJson?.ascYear ?? ascYearJson?.derived?.ascYear ?? null;
  const asOf = ascYearJson?.asOf ?? ascYearJson?.derived?.asOf ?? null;
  return { ay, asOf };
}

// Palette (same as before, readable)
const palette = {
  spaceCadet: "#102B53",
  uclaBlue: "#50698D",
  pinkLavender: "#CEB5D4",
  cyanAzure: "#4E7AB1",
  airBlue: "#7D9FC0",

  ink: "#0B1020",
  inkSoft: "rgba(11,16,32,.78)",
  inkMute: "rgba(11,16,32,.62)",

  panel: "rgba(245, 246, 250, 0.86)",
  panel2: "rgba(240, 241, 246, 0.78)",
  border: "rgba(255,255,255,0.28)",
  borderDark: "rgba(11,16,32,0.12)",

  dialTick: "rgba(255,255,255,0.24)",
  dialTickStrong: "rgba(255,255,255,0.45)",
  dialText: "rgba(255,255,255,0.72)",
  dialTextStrong: "rgba(255,255,255,0.92)",
};

function PanelChrome({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[28px] border overflow-hidden backdrop-blur-[12px]",
        "shadow-[0_30px_120px_rgba(0,0,0,.35)]",
        className,
      ].join(" ")}
      style={{ borderColor: palette.border }}
    >
      {children}
    </div>
  );
}

function SmallCard({
  title,
  big,
  sub,
}: {
  title: string;
  big: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-4"
      style={{
        background: palette.panel2,
        borderColor: palette.borderDark,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.55)",
      }}
    >
      <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: palette.inkMute }}>
        {title}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight" style={{ color: palette.ink }}>
        {big}
      </div>
      {sub ? (
        <div className="mt-1 text-xs" style={{ color: palette.inkSoft }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function Meter({
  value01,
  left,
  right,
}: {
  value01: number;
  left: string;
  right: string;
}) {
  const p = clamp01(value01);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs" style={{ color: palette.inkMute }}>
        <div>{left}</div>
        <div>{right}</div>
      </div>

      <div
        className="mt-2 h-2 rounded-full border"
        style={{
          borderColor: palette.borderDark,
          background: "rgba(255,255,255,.55)",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${(p * 100).toFixed(1)}%`,
            background: `linear-gradient(90deg, ${palette.cyanAzure}, ${palette.uclaBlue})`,
            boxShadow: "0 0 0 1px rgba(255,255,255,.15) inset",
          }}
        />
      </div>
    </div>
  );
}

function CycleWheelDial({
  angleDeg,
}: {
  angleDeg: number;
}) {
  const a = normDeg(angleDeg);
  const rot = a - 90;
  const ticks = Array.from({ length: 36 }, (_, i) => i);

  return (
    <div
      className="rounded-[22px] border px-6 py-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,.35) 100%)",
        borderColor: "rgba(255,255,255,.12)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.22em]" style={{ color: palette.dialText }}>
          CYCLE WHEEL
        </div>
        <div className="text-xs" style={{ color: palette.dialText }}>
          {a.toFixed(2)}°
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center">
        <div className="relative" style={{ width: 210, height: 210 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "1px solid rgba(255,255,255,.12)",
              background:
                "radial-gradient(circle at 40% 30%, rgba(255,255,255,.08) 0%, rgba(255,255,255,0) 55%), rgba(0,0,0,.18)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.10)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              inset: 14,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(0,0,0,.22)",
            }}
          />

          {ticks.map((i) => {
            const deg = i * 10;
            const isStrong = deg % 45 === 0 || deg % 90 === 0; // emphasize 45° ontology
            const r1 = 98;
            const r2 = isStrong ? 84 : 90;
            const x1 = 105 + r1 * Math.cos(((deg - 90) * Math.PI) / 180);
            const y1 = 105 + r1 * Math.sin(((deg - 90) * Math.PI) / 180);
            const x2 = 105 + r2 * Math.cos(((deg - 90) * Math.PI) / 180);
            const y2 = 105 + r2 * Math.sin(((deg - 90) * Math.PI) / 180);

            return (
              <div
                key={i}
                className="absolute"
                style={{ left: 0, top: 0, width: 210, height: 210, pointerEvents: "none" }}
              >
                <svg width="210" height="210" style={{ overflow: "visible" }}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isStrong ? palette.dialTickStrong : palette.dialTick}
                    strokeWidth={isStrong ? 2 : 1}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            );
          })}

          <div className="absolute left-1/2 top-[10px] -translate-x-1/2 text-[11px] tracking-[0.2em]" style={{ color: palette.dialTextStrong }}>
            SPR
          </div>
          <div className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[11px] tracking-[0.2em]" style={{ color: palette.dialTextStrong }}>
            SMR
          </div>
          <div className="absolute left-1/2 bottom-[10px] -translate-x-1/2 text-[11px] tracking-[0.2em]" style={{ color: palette.dialTextStrong }}>
            FAL
          </div>
          <div className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[11px] tracking-[0.2em]" style={{ color: palette.dialTextStrong }}>
            WTR
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 2, height: 190, background: "rgba(255,255,255,.10)" }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 190, height: 2, background: "rgba(255,255,255,.10)" }} />

          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: 86,
              height: 2,
              transformOrigin: "0% 50%",
              transform: `translateY(-50%) rotate(${rot}deg)`,
              background: `linear-gradient(90deg, rgba(255,255,255,.15), ${palette.cyanAzure})`,
              boxShadow: "0 0 18px rgba(78,122,177,.35)",
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: 8,
              height: 8,
              transform: "translate(-50%, -50%)",
              background: palette.cyanAzure,
              boxShadow: "0 0 16px rgba(78,122,177,.45)",
            }}
          />
        </div>
      </div>

      <div className="mt-5 text-center text-xs" style={{ color: palette.dialText }}>
        0° starts at your natal ASC; the hand moves with the transiting Sun.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[0]">
      <div className="text-[10px] tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,.70)" }}>
        {label}
      </div>
      <div className="mt-1 text-sm font-medium" style={{ color: "rgba(255,255,255,.92)" }}>
        {value}
      </div>
    </div>
  );
}

// 8-phase helpers (UI side, in case cache hasn’t been rebuilt yet)
function phaseIndexFromCyclePos(cyclePos: number) {
  const idx = Math.floor(normDeg(cyclePos) / 45);
  return Math.max(0, Math.min(7, idx));
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await ensureProfileCaches(user.id);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: palette.spaceCadet }}>
        <div className="text-white/80 text-sm">No profile found.</div>
      </div>
    );
  }

  if (!profile.setupDone) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: palette.spaceCadet }}>
        <div className="w-full max-w-lg">
          <PanelChrome className="bg-white/10">
            <div className="p-6" style={{ background: palette.panel }}>
              <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: palette.inkMute }}>
                Setup
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: palette.ink }}>
                Finish your profile
              </div>
              <div className="mt-3 text-sm" style={{ color: palette.inkSoft }}>
                Add birth details and location so URA can generate your asc-year cycle.
              </div>
              <div className="mt-6">
                <Link
                  href="/profile/setup"
                  className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm"
                  style={{
                    background: palette.spaceCadet,
                    color: "rgba(255,255,255,.92)",
                    borderColor: "rgba(255,255,255,.22)",
                  }}
                >
                  Continue
                </Link>
              </div>
            </div>
          </PanelChrome>
        </div>
      </div>
    );
  }

  const tz = profile.timezone ?? "America/New_York";
  const locationLine = [profile.city, profile.state].filter(Boolean).join(", ") || tz;
  const displayName = pickDisplayName(user, profile);

  const natal = profile.natalChartJson as any;
  const ascYearJson = profile.ascYearJson as any;

  const { planets, asc } = getNatalSources(natal);
  const natalAscLon = safeNum(asc);
  const natalSunLon = safeNum(planets?.sun?.lon);
  const natalMoonLon = safeNum(planets?.moon?.lon);

  const { ay, asOf } = getAscYearSlice(ascYearJson);

  // Moving bodies (as-of)
  const movingSunLon =
    safeNum(asOf?.bodies?.sun?.lon) ??
    safeNum(asOf?.data?.planets?.sun?.lon) ??
    null;

  const movingMoonLon =
    safeNum(asOf?.bodies?.moon?.lon) ??
    safeNum(asOf?.data?.planets?.moon?.lon) ??
    null;

  // Cycle position (0..360) — prefer ay.cyclePosition, fallback compute if needed
  const cyclePos = normDeg(safeNum(ay?.cyclePosition) ?? 0);

  // --- 8 phase model (authoritative if present, fallback otherwise) ---
  const phaseIndex =
    safeNum(ay?.phaseIndex) != null
      ? Math.max(0, Math.min(7, Number(ay.phaseIndex)))
      : phaseIndexFromCyclePos(cyclePos);

  const phaseLabel = (typeof ay?.phaseLabel === "string" && ay.phaseLabel) || `P${phaseIndex + 1}`;
  const nextPhaseIndex = (phaseIndex + 1) % 8;
  const nextPhaseLabel = (typeof ay?.nextPhaseLabel === "string" && ay.nextPhaseLabel) || `P${nextPhaseIndex + 1}`;

  const phaseDegInto =
    safeNum(ay?.phaseDegInto) ?? (cyclePos - phaseIndex * 45);

  const phaseProgress01 =
    safeNum(ay?.phaseProgress01) ?? clamp01(phaseDegInto / 45);

  // Season quarter: 2 phases per season
  const seasonIndex = Math.floor(phaseIndex / 2); // 0..3
  const season = (typeof ay?.season === "string" && ay.season) || SEASONS[seasonIndex] || "Spring";

  const seasonDegInto =
    safeNum(ay?.seasonDegInto) ?? (cyclePos % 90);

  const seasonProgress01 =
    safeNum(ay?.seasonProgress01) ?? clamp01(seasonDegInto / 90);

  // Orientation strings
  const currentLabel = `${season} · ${phaseLabel}`;

  // Shift estimate to next 45° boundary
  let shiftText = "—";
  let shiftSub = "—";
  if (natalAscLon != null && movingSunLon != null) {
    // next boundary in ecliptic longitude space:
    const nextBoundaryCycleDeg = nextPhaseIndex * 45;
    const nextBoundaryLon = normDeg(natalAscLon + nextBoundaryCycleDeg);

    const delta = degDeltaForward(movingSunLon, nextBoundaryLon);
    const days = estimateDaysUntil(delta);

    const asOfISO =
      (typeof ascYearJson?.input?.as_of_date === "string" && ascYearJson.input.as_of_date) ||
      (profile.asOfDate ? profile.asOfDate.toISOString() : new Date().toISOString());

    const etaISO = addDaysISO(asOfISO, days);

    shiftText = `~${days.toFixed(1)} days`;
    shiftSub = etaISO ? fmtLocalDateTime(etaISO, tz) : "—";
  }

  // Avatar
  const avatarUrl = (typeof profile.avatarUrl === "string" && profile.avatarUrl) || null;

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(1200px 700px at 50% 0%, rgba(206,181,212,.22) 0%, rgba(206,181,212,0) 55%),
          radial-gradient(1000px 700px at 20% 40%, rgba(78,122,177,.22) 0%, rgba(78,122,177,0) 55%),
          radial-gradient(1000px 700px at 80% 65%, rgba(125,159,192,.20) 0%, rgba(125,159,192,0) 55%),
          linear-gradient(180deg, rgba(16,43,83,.96) 0%, rgba(8,18,36,.98) 100%)
        `,
      }}
    >
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Identity strip */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="relative overflow-hidden rounded-2xl border"
              style={{
                width: 56,
                height: 56,
                borderColor: "rgba(255,255,255,.18)",
                background: "rgba(255,255,255,.10)",
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white/70 text-sm">+</div>
              )}
            </div>

            <div>
              <div className="text-white/75 text-sm">Profile</div>
              <div className="text-white text-lg font-semibold tracking-tight">{displayName}</div>
              <div className="text-white/65 text-xs mt-1">{locationLine}</div>

              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="ASC (Natal)" value={natalAscLon != null ? fmtDegMin(natalAscLon) : "—"} />
                <Stat label="Sun (Natal)" value={natalSunLon != null ? fmtDegMin(natalSunLon) : "—"} />
                <Stat label="Moon (Natal)" value={natalMoonLon != null ? fmtDegMin(natalMoonLon) : "—"} />
                <Stat label="Sun (Moving)" value={movingSunLon != null ? fmtDegMin(movingSunLon) : "—"} />
                <Stat label="Moon (Moving)" value={movingMoonLon != null ? fmtDegMin(movingMoonLon) : "—"} />
                <Stat label="Timezone" value={tz} />
              </div>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              className="rounded-full border px-4 py-2 text-sm text-white/90 hover:text-white"
              style={{
                borderColor: "rgba(255,255,255,.22)",
                background: "rgba(255,255,255,.10)",
              }}
            >
              Logout
            </button>
          </form>
        </div>

        {/* Main panel */}
        <PanelChrome className="bg-white/10">
          <div className="px-8 py-7" style={{ background: palette.panel }}>
            <div className="text-center text-[11px] tracking-[0.18em] uppercase" style={{ color: palette.inkMute }}>
              Current
            </div>

            <div className="mt-2 text-center text-3xl font-semibold tracking-tight" style={{ color: palette.ink }}>
              {currentLabel}
            </div>

            <div className="mt-2 text-center text-sm" style={{ color: palette.inkSoft }}>
              Degrees into phase:{" "}
              <span style={{ color: palette.ink, fontWeight: 600 }}>{phaseDegInto.toFixed(2)}°</span>{" "}
              <span style={{ color: palette.inkMute }}>/ 45°</span>
            </div>

            {/* Orientation */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <SmallCard title="Orientation" big={`${season} · ${phaseLabel}`} sub="Current season + phase (45°)." />
              <SmallCard title="Next" big={`${seasonIndex === Math.floor(nextPhaseIndex / 2) ? season : SEASONS[Math.floor(nextPhaseIndex / 2)]} · ${nextPhaseLabel}`} sub="The next 45° phase." />
              <SmallCard title="Shift" big={shiftText} sub={shiftSub} />
            </div>

            {/* Progress bars */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border p-4" style={{ background: palette.panel2, borderColor: palette.borderDark }}>
                <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: palette.inkMute }}>
                  45° Phase Boundary
                </div>
                <div className="mt-2 text-sm" style={{ color: palette.inkSoft }}>
                  Progress through the current phase (0–45°).
                </div>
                <div className="mt-4">
                  <Meter value01={phaseProgress01} left={`${phaseDegInto.toFixed(2)}°`} right="45°" />
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ background: palette.panel2, borderColor: palette.borderDark }}>
                <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: palette.inkMute }}>
                  90° Season Arc
                </div>
                <div className="mt-2 text-sm" style={{ color: palette.inkSoft }}>
                  Progress within the current season quarter (0–90°).
                </div>
                <div className="mt-4">
                  <Meter value01={seasonProgress01} left={`${seasonDegInto.toFixed(2)}°`} right="90°" />
                </div>
              </div>
            </div>

            {/* Center visual: cycle wheel */}
            <div className="mt-7">
              <CycleWheelDial angleDeg={cyclePos} />
            </div>

            <div className="mt-6 flex gap-3 justify-center">
              <Link
                href="/seasons"
                className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm"
                style={{
                  background: palette.spaceCadet,
                  color: "rgba(255,255,255,.92)",
                  borderColor: "rgba(255,255,255,.20)",
                }}
              >
                Go to /seasons
              </Link>
              <Link
                href="/calendar"
                className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm"
                style={{
                  background: "rgba(255,255,255,.10)",
                  color: "rgba(255,255,255,.92)",
                  borderColor: "rgba(255,255,255,.22)",
                }}
              >
                Go to /calendar
              </Link>
            </div>
          </div>
        </PanelChrome>
      </div>
    </div>
  );
}
