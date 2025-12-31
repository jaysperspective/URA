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
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
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

function getDerivedSummary(obj: any) {
  const summary = obj?.derived?.summary ?? obj?.summary; // wrapper returns `summary` at top-level
  if (!summary) return null;
  return {
    ascYearLabel: typeof summary.ascYearLabel === "string" ? summary.ascYearLabel : null,
    lunationLabel: typeof summary.lunationLabel === "string" ? summary.lunationLabel : null,
  };
}

function getAscYearSlice(ascYearJson: any) {
  // wrapper: { ascYear, asOf, natal, summary, text }
  const ay = ascYearJson?.ascYear ?? ascYearJson?.derived?.ascYear ?? ascYearJson?.derived?.ascYear;
  const asOf = ascYearJson?.asOf ?? ascYearJson?.derived?.asOf ?? null;
  const natal = ascYearJson?.natal ?? ascYearJson?.derived?.natal ?? null;
  return { ay, asOf, natal };
}

function degDeltaForward(fromLon: number, toLon: number) {
  const a = normDeg(fromLon);
  const b = normDeg(toLon);
  const d = b - a;
  return d >= 0 ? d : d + 360;
}

function estimateDaysUntil(deltaDeg: number) {
  // average solar motion ~ 0.9856°/day
  const perDay = 0.9856;
  return deltaDeg / perDay;
}

function addDaysISO(isoLike: string, days: number) {
  const d = new Date(isoLike);
  if (!Number.isFinite(d.getTime())) return null;
  const ms = d.getTime() + days * 24 * 60 * 60 * 1000;
  const out = new Date(ms);
  return out.toISOString();
}

function fmtLocalDateTime(iso: string, tz: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Moonstone palette (warm stone panels on green world)
 */
const moon = {
  panel: "bg-[#D7D3C8]/92",
  panel2: "bg-[#CEC9BD]/92",
  ink: "text-[#151514]",
  inkSoft: "text-[#2B2A27]",
  inkMute: "text-[#4A4843]",
  border: "border-[#FFFFFF]/35",
  borderSoft: "border-[#000000]/10",
  shadow: "shadow-[0_25px_90px_rgba(0,0,0,.28)]",
  chip: "bg-[#ECE8DF] border-[#000000]/10 text-[#1C1B18]",
  chip2: "bg-[#E2DED4] border-[#000000]/10 text-[#1C1B18]",
  inner: "bg-[#F1EEE6]/75 border-[#000000]/10",
  btn: "bg-[#ECE8DF] border-[#000000]/15 text-[#1C1B18] hover:bg-[#F3F1EA]",
  btnGhost: "bg-transparent border-[#000000]/20 text-[#1C1B18] hover:bg-[#ECE8DF]/60",
  accent: "#2D5128",
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
        "rounded-[26px] border overflow-hidden backdrop-blur-[10px]",
        moon.border,
        moon.shadow,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function GlintWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(1200px 400px at 20% -10%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 55%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function Badge({
  children,
  tone = "base",
}: {
  children: React.ReactNode;
  tone?: "base" | "muted";
}) {
  return (
    <GlintWrap>
      <span
        className={[
          "inline-flex items-center rounded-full border px-3 py-1 text-xs",
          "shadow-[inset_0_1px_0_rgba(255,255,255,.55)]",
          tone === "muted" ? moon.chip2 : moon.chip,
        ].join(" ")}
      >
        {children}
      </span>
    </GlintWrap>
  );
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={[
        "relative inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm transition-colors overflow-hidden",
        "shadow-[inset_0_1px_0_rgba(255,255,255,.65)]",
        moon.btn,
      ].join(" ")}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.55) 30%, rgba(255,255,255,0) 55%)",
          transform: "translateX(-35%)",
        }}
      />
      <span className="relative">{children}</span>
    </Link>
  );
}

function Meter({
  value01,
  labelLeft,
  labelRight,
}: {
  value01: number;
  labelLeft: string;
  labelRight: string;
}) {
  const p = clamp01(value01);
  return (
    <div className="w-full">
      <div className={["flex items-center justify-between text-xs", moon.inkMute].join(" ")}>
        <div>{labelLeft}</div>
        <div>{labelRight}</div>
      </div>
      <div className={["mt-2 h-2 rounded-full border", moon.inner].join(" ")}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${(p * 100).toFixed(1)}%`,
            background: moon.accent,
            opacity: 0.75,
          }}
        />
      </div>
    </div>
  );
}

function MiniCard({
  title,
  big,
  sub,
}: {
  title: string;
  big: string;
  sub?: string;
}) {
  return (
    <div className={["rounded-2xl border p-4", moon.borderSoft, "bg-white/35"].join(" ")}>
      <div className={["text-[11px] tracking-[0.18em] uppercase", moon.inkMute].join(" ")}>
        {title}
      </div>
      <div className={["mt-2 text-lg font-semibold tracking-tight", moon.ink].join(" ")}>
        {big}
      </div>
      {sub ? <div className={["mt-1 text-xs", moon.inkSoft].join(" ")}>{sub}</div> : null}
    </div>
  );
}

function Row({
  left,
  right,
  icon,
}: {
  left: string;
  right: string;
  icon?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className={["text-sm", moon.inkSoft].join(" ")}>
          {icon ? <span className="mr-2 opacity-70">{icon}</span> : null}
          {left}
        </div>
      </div>
      <div className={["text-sm font-medium", moon.ink].join(" ")}>{right}</div>
    </div>
  );
}

function CycleWheel({
  angleDeg,
}: {
  angleDeg: number; // 0..360
}) {
  const a = normDeg(angleDeg);
  // rotate hand so 0° is at top (12 o'clock)
  const rot = a - 90;

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative rounded-full border"
        style={{
          width: 210,
          height: 210,
          background: "rgba(255,255,255,.28)",
          borderColor: "rgba(0,0,0,.10)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)",
        }}
      >
        <div
          className="absolute inset-3 rounded-full border"
          style={{
            background: "rgba(255,255,255,.15)",
            borderColor: "rgba(0,0,0,.08)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: 86,
            height: 2,
            transformOrigin: "0% 50%",
            transform: `translateY(-50%) rotate(${rot}deg)`,
            background: "rgba(21,21,20,.55)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 8,
            height: 8,
            transform: "translate(-50%, -50%)",
            background: "rgba(21,21,20,.55)",
          }}
        />
      </div>
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
          <PanelChrome>
            <div className="p-6">
              <div className={["text-[11px] tracking-[0.18em] uppercase", moon.inkMute].join(" ")}>
                Setup
              </div>
              <div className={["mt-2 text-2xl font-semibold tracking-tight", moon.ink].join(" ")}>
                Finish your profile
              </div>
              <div className={["mt-3 text-sm", moon.inkSoft].join(" ")}>
                Add birth details and location so URA can generate your live cycle.
              </div>
              <div className="mt-6">
                <ActionLink href="/profile/setup">Continue</ActionLink>
              </div>
            </div>
          </PanelChrome>
        </div>
      </div>
    );
  }

  const tz = profile.timezone ?? "America/New_York";
  const locationLine = [profile.city, profile.state].filter(Boolean).join(", ") || tz;

  const natal = profile.natalChartJson as any;
  const ascYearJson = profile.ascYearJson as any;
  const lunationJson = profile.lunationJson as any;

  const displayName = pickDisplayName(user, profile);

  const { planets, asc } = getNatalSources(natal);
  const natalSunLon = safeNum(planets?.sun?.lon);
  const natalMoonLon = safeNum(planets?.moon?.lon);
  const natalAscLon = safeNum(asc);

  const { ay, asOf: ayAsOf } = getAscYearSlice(ascYearJson);

  const ascSummary = getDerivedSummary(ascYearJson);
  const lunaSummary = getDerivedSummary(lunationJson);

  // Current AY label
  const season = typeof ay?.season === "string" ? ay.season : "—";
  const modality = typeof ay?.modality === "string" ? ay.modality : "—";
  const currentLabel =
    ascSummary?.ascYearLabel ||
    (season !== "—" && modality !== "—" ? `${season} · ${modality}` : "—");

  // Core AY numbers
  const cyclePos = safeNum(ay?.cyclePosition) ?? null; // 0..360
  const degIntoModality = safeNum(ay?.degreesIntoModality) ?? null; // 0..30
  const boundaries = ay?.boundariesLongitude ?? null;

  // Transiting sun from wrapper's asOf
  const transitSunLon =
    safeNum(ayAsOf?.bodies?.sun?.lon) ??
    safeNum(ayAsOf?.data?.planets?.sun?.lon) ??
    null;

  // Orientation: Next segment + change estimate
  const segIndex = cyclePos == null ? null : Math.floor(normDeg(cyclePos) / 30); // 0..11
  const nextSegIndex = segIndex == null ? null : (segIndex + 1) % 12;

  const modalitySeq = ["Cardinal", "Fixed", "Mutable"] as const;
  const seasonSeq = ["Spring", "Summer", "Fall", "Winter"] as const;

  const segSeason =
    segIndex == null ? null : seasonSeq[Math.floor(segIndex / 3) % 4] ?? null;
  const segMod =
    segIndex == null ? null : modalitySeq[segIndex % 3] ?? null;

  const nextSeason =
    nextSegIndex == null ? null : seasonSeq[Math.floor(nextSegIndex / 3) % 4] ?? null;
  const nextMod =
    nextSegIndex == null ? null : modalitySeq[nextSegIndex % 3] ?? null;

  const nextLabel = nextSeason && nextMod ? `${nextSeason} · ${nextMod}` : "—";

  // Estimate next boundary change using sun longitude + boundary longitude
  let shiftText = "—";
  let shiftSub = "Based on remaining degrees in this segment.";
  if (transitSunLon != null && boundaries && nextSegIndex != null) {
    const nextKey = `deg${nextSegIndex * 30}`;
    const nextBoundaryLon = safeNum(boundaries?.[nextKey]);
    const asOfISO =
      (typeof ascYearJson?.input?.as_of_date === "string" && ascYearJson.input.as_of_date) ||
      (profile.asOfDate ? profile.asOfDate.toISOString() : new Date().toISOString());

    if (nextBoundaryLon != null) {
      const delta = degDeltaForward(transitSunLon, nextBoundaryLon);
      const days = estimateDaysUntil(delta);
      const etaISO = addDaysISO(asOfISO, days);
      shiftText = `~${days.toFixed(1)} days`;
      shiftSub = etaISO ? fmtLocalDateTime(etaISO, tz) : "—";
    }
  }

  // Progress bars
  const modalityProgress01 =
    degIntoModality == null ? 0 : clamp01(degIntoModality / 30);

  const seasonProgress01 =
    cyclePos == null ? 0 : clamp01((normDeg(cyclePos) % 90) / 90);

  const lunLabel = lunaSummary?.lunationLabel ?? "—";

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% 10%, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 55%), linear-gradient(180deg, rgba(20,20,18,.18) 0%, rgba(0,0,0,.18) 100%), #2D5128",
      }}
    >
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-white/80 text-sm">Profile</div>
            <div className="text-white text-lg font-semibold tracking-tight">{displayName}</div>
            <div className="text-white/70 text-xs mt-1">{locationLine}</div>
          </div>

          <form action={logoutAction}>
            <button
              className="rounded-full border px-4 py-2 text-sm text-white/90 hover:text-white"
              style={{
                borderColor: "rgba(255,255,255,.35)",
                background: "rgba(255,255,255,.10)",
              }}
            >
              Logout
            </button>
          </form>
        </div>

        {/* Main panel */}
        <PanelChrome className="bg-white/10">
          <div className={[moon.panel, "px-8 py-7"].join(" ")}>
            <div className={["text-[11px] tracking-[0.18em] uppercase text-center", moon.inkMute].join(" ")}>
              Current
            </div>
            <div className={["mt-2 text-center text-3xl font-semibold tracking-tight", moon.ink].join(" ")}>
              {currentLabel}
            </div>

            <div className={["mt-2 text-center text-sm", moon.inkSoft].join(" ")}>
              {degIntoModality != null ? (
                <>
                  Degrees into modality:{" "}
                  <span className="font-semibold">{degIntoModality.toFixed(2)}°</span>{" "}
                  <span className={moon.inkMute}>/ 30°</span>
                </>
              ) : (
                <span>—</span>
              )}
            </div>

            {/* ORIENTATION (Now / Next / Shift) */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <MiniCard
                title="Orientation"
                big={segSeason && segMod ? `${segSeason} · ${segMod}` : "—"}
                sub="Current season + modality."
              />
              <MiniCard title="Next" big={nextLabel} sub="The next 30° segment." />
              <MiniCard title="Shift" big={shiftText} sub={shiftSub} />
            </div>

            {/* PROGRESS (Modality boundary + Season) */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={["rounded-2xl border p-4", moon.borderSoft, "bg-white/35"].join(" ")}>
                <div className={["text-[11px] tracking-[0.18em] uppercase", moon.inkMute].join(" ")}>
                  30° Boundary
                </div>
                <div className={["mt-2 text-sm", moon.inkSoft].join(" ")}>
                  Progress through the current modality segment (0–30°).
                </div>
                <div className="mt-4">
                  <Meter
                    value01={modalityProgress01}
                    labelLeft={degIntoModality != null ? `${degIntoModality.toFixed(2)}°` : "—"}
                    labelRight="30°"
                  />
                </div>
              </div>

              <div className={["rounded-2xl border p-4", moon.borderSoft, "bg-white/35"].join(" ")}>
                <div className={["text-[11px] tracking-[0.18em] uppercase", moon.inkMute].join(" ")}>
                  90° Season Arc
                </div>
                <div className={["mt-2 text-sm", moon.inkSoft].join(" ")}>
                  Progress within the current season quarter (0–90°).
                </div>
                <div className="mt-4">
                  <Meter
                    value01={seasonProgress01}
                    labelLeft={cyclePos != null ? `${(normDeg(cyclePos) % 90).toFixed(2)}°` : "—"}
                    labelRight="90°"
                  />
                </div>
              </div>
            </div>

            {/* Wheel */}
            <div className="mt-7">
              <CycleWheel angleDeg={cyclePos ?? 0} />
              <div className={["mt-3 text-center text-xs", moon.inkMute].join(" ")}>
                AY-{cyclePos != null ? normDeg(cyclePos).toFixed(2) : "—"}° •{" "}
                {lunLabel !== "—" ? `Lunar: ${lunLabel}` : "—"}
              </div>
            </div>
          </div>
        </PanelChrome>

        {/* Bottom rows */}
        <div className="mt-6 rounded-2xl border overflow-hidden bg-white/10" style={{ borderColor: "rgba(255,255,255,.25)" }}>
          <div className={[moon.panel2].join(" ")}>
            <div style={{ borderBottom: "1px solid rgba(0,0,0,.08)" }}>
              <Row
                left="Ascendant (Natal)"
                right={
                  natalAscLon != null
                    ? `${fmtLon(natalAscLon)} • ${signFromLon(natalAscLon)}`
                    : "—"
                }
                icon="↑"
              />
            </div>

            <div style={{ borderBottom: "1px solid rgba(0,0,0,.08)" }}>
              <Row
                left="Transiting Sun"
                right={
                  transitSunLon != null
                    ? `${fmtLon(transitSunLon)} • ${signFromLon(transitSunLon)}`
                    : "—"
                }
                icon="☉"
              />
            </div>

            <div style={{ borderBottom: "1px solid rgba(0,0,0,.08)" }}>
              <Row
                left="Sun-from-ASC (Cycle Position)"
                right={cyclePos != null ? `${normDeg(cyclePos).toFixed(2)}°` : "—"}
                icon="⦿"
              />
            </div>

            <Row left="Season / Modality" right={currentLabel} icon="⌁" />
          </div>
        </div>

        {/* Small footer chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge>Timezone: {tz}</Badge>
          <Badge tone="muted">Lunation: {lunLabel}</Badge>
          {natalSunLon != null ? <Badge tone="muted">Natal Sun: {signFromLon(natalSunLon)}</Badge> : null}
          {natalMoonLon != null ? <Badge tone="muted">Natal Moon: {signFromLon(natalMoonLon)}</Badge> : null}
        </div>

        {/* Quick links */}
        <div className="mt-8 flex gap-3">
          <ActionLink href="/seasons">Go to /seasons</ActionLink>
          <ActionLink href="/calendar">Go to /calendar</ActionLink>
        </div>
      </div>
    </div>
  );
}
