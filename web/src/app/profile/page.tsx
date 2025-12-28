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

/**
 * Subtle noise as inline SVG data URI.
 * (No external assets, no global CSS required.)
 */
const NOISE_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="140" height="140" filter="url(#n)" opacity=".22"/>
</svg>
`);
const NOISE_URL = `url("data:image/svg+xml,${NOISE_SVG}")`;

function PanelChrome({
  children,
  accent = true,
  className = "",
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={["relative rounded-3xl border overflow-hidden", moon.border, moon.shadow, className].join(" ")}>
      {/* Accent line */}
      {accent ? (
        <div
          className="absolute left-0 top-0 h-[3px] w-full opacity-70"
          style={{
            background:
              "linear-gradient(90deg, rgba(45,81,40,.0) 0%, rgba(45,81,40,.9) 20%, rgba(45,81,40,.7) 80%, rgba(45,81,40,.0) 100%)",
          }}
        />
      ) : null}

      {/* Moonstone base */}
      <div className={["relative", moon.panel].join(" ")}>
        {/* Stone grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-multiply"
          style={{
            backgroundImage: NOISE_URL,
          }}
        />
        {/* Soft mineral sheen */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(1200px 500px at 20% 0%, rgba(255,255,255,.45), rgba(255,255,255,0) 60%)",
          }}
        />
        {children}
      </div>
    </div>
  );
}

function InnerStone({ children }: { children: React.ReactNode }) {
  return (
    <div className={["relative rounded-2xl border p-4", moon.borderSoft, moon.inner].join(" ")}>
      {/* Tiny grain */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.14] mix-blend-multiply"
        style={{ backgroundImage: NOISE_URL }}
      />
      {/* Small highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.22]"
        style={{
          background:
            "radial-gradient(600px 220px at 25% 0%, rgba(255,255,255,.55), rgba(255,255,255,0) 60%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function GlintWrap({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex overflow-hidden rounded-full">
      {/* glint sweep */}
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.55) 28%, rgba(255,255,255,0) 52%)",
          transform: "translateX(-45%)",
        }}
      />
      <span className="relative">{children}</span>
    </span>
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
    <PanelChrome className={className}>
      <div className="px-6 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            {kicker ? (
              <div className={["text-[11px] tracking-[0.18em] uppercase", moon.inkMute].join(" ")}>
                {kicker}
              </div>
            ) : null}
            <div className={["mt-2 text-lg font-semibold tracking-tight", moon.ink].join(" ")}>
              {title}
            </div>
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">{children}</div>
    </PanelChrome>
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
    <div className="min-h-screen bg-[#2D5128]">
      {/* Atmosphere on green world */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),rgba(0,0,0,0)_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0)_55%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-white/70 text-[11px] tracking-[0.18em] uppercase">URA</div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile/setup"
              className={[
                "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm transition-colors",
                "border-white/25 bg-white/10 text-white hover:bg-white/15",
                "shadow-[inset_0_1px_0_rgba(255,255,255,.35)]",
              ].join(" ")}
            >
              Edit
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className={[
                  "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm transition-colors",
                  "border-white/25 bg-white/10 text-white hover:bg-white/15",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,.35)]",
                ].join(" ")}
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT: identity / natal */}
          <div className="lg:col-span-5">
            <PanelChrome>
              {/* Identity hero */}
              <div className="p-7">
                <div className={["text-4xl font-semibold tracking-tight", moon.ink].join(" ")}>
                  {name}
                </div>
                <div className={["mt-2 text-sm", moon.inkMute].join(" ")}>
                  {locationLine}
                </div>

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

                <div className="mt-6 flex flex-wrap gap-2">
                  <ActionLink href="/chart">Chart</ActionLink>
                  <ActionLink href="/seasons">Seasons</ActionLink>
                  <ActionLink href="/lunation">Lunation</ActionLink>
                </div>
              </div>

              <div className="h-px bg-black/10" />

              {/* Natal placements */}
              <div className="p-7">
                <div className={["text-[11px] tracking-[0.18em] uppercase", moon.inkMute].join(" ")}>
                  Natal placements
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ascRow ? (
                    <InnerStone>
                      <div className={["text-sm font-medium", moon.ink].join(" ")}>
                        {ascRow.label}
                      </div>
                      <div className={["mt-1 text-sm", moon.inkMute].join(" ")}>
                        {ascRow.sign} <span className="opacity-50">•</span> {ascRow.deg}
                      </div>
                    </InnerStone>
                  ) : null}

                  {planetRows.map((r) => (
                    <InnerStone key={r.key}>
                      <div className={["text-sm font-medium", moon.ink].join(" ")}>
                        {r.label}
                      </div>
                      <div className={["mt-1 text-sm", moon.inkMute].join(" ")}>
                        {r.sign} <span className="opacity-50">•</span> {r.deg}
                      </div>
                    </InnerStone>
                  ))}

                  {!ascRow && planetRows.length === 0 ? (
                    <InnerStone>
                      <div className={["text-sm", moon.inkMute].join(" ")}>Natal data not available yet.</div>
                    </InnerStone>
                  ) : null}
                </div>
              </div>
            </PanelChrome>
          </div>

          {/* RIGHT: live panels */}
          <div className="lg:col-span-7 space-y-4">
            <Card
              kicker="Current cycle"
              title="Ascendant Year"
              right={
                <div className="flex flex-wrap gap-2">
                  {ascParts.map((p) => (
                    <Badge key={p} tone="muted">
                      {p}
                    </Badge>
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InnerStone>
                  <div className={["text-xs tracking-wide uppercase", moon.inkMute].join(" ")}>
                    Focus
                  </div>
                  <div className={["mt-2 text-sm", moon.inkSoft].join(" ")}>
                    Seasonal placement and modality.
                  </div>
                </InnerStone>

                <InnerStone>
                  <div className={["text-xs tracking-wide uppercase", moon.inkMute].join(" ")}>
                    Next
                  </div>
                  <div className={["mt-2 text-sm", moon.inkSoft].join(" ")}>
                    Boundary timing will live here.
                  </div>
                </InnerStone>
              </div>

              <div className="mt-5">
                <ActionLink href="/seasons">Open seasons</ActionLink>
              </div>
            </Card>

            <Card kicker="Today" title="Lunation" right={<Badge tone="muted">{String(lunLabel)}</Badge>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InnerStone>
                  <div className={["text-xs tracking-wide uppercase", moon.inkMute].join(" ")}>
                    Signal
                  </div>
                  <div className={["mt-2 text-sm", moon.inkSoft].join(" ")}>
                    Daily rhythm marker.
                  </div>
                </InnerStone>

                <InnerStone>
                  <div className={["text-xs tracking-wide uppercase", moon.inkMute].join(" ")}>
                    Next
                  </div>
                  <div className={["mt-2 text-sm", moon.inkSoft].join(" ")}>
                    Phase transitions and guidance.
                  </div>
                </InnerStone>
              </div>

              <div className="mt-5">
                <ActionLink href="/lunation">Open lunation</ActionLink>
              </div>
            </Card>

            {/* Workspace row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card kicker="URA" title="Readings">
                <InnerStone>
                  <div className={["text-sm", moon.inkSoft].join(" ")}>
                    Ontology-driven interpretations will render here as cards.
                  </div>
                  <ul className={["mt-3 space-y-2 text-sm list-disc pl-5", moon.inkMute].join(" ")}>
                    <li>Natal synthesis</li>
                    <li>Current cycle guidance</li>
                    <li>Timing windows</li>
                    <li>Action prompts</li>
                  </ul>
                </InnerStone>

                <div className="mt-4">
                  <button
                    disabled
                    className={[
                      "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm cursor-not-allowed opacity-60",
                      moon.btnGhost,
                      "shadow-[inset_0_1px_0_rgba(255,255,255,.55)]",
                    ].join(" ")}
                  >
                    Coming soon
                  </button>
                </div>
              </Card>

              <Card kicker="Daily" title="Journal">
                <InnerStone>
                  <div className={["text-sm", moon.inkSoft].join(" ")}>
                    Journal entries will live here—tagged by cycle and date.
                  </div>
                  <div className={["mt-3 text-sm", moon.inkMute].join(" ")}>
                    The composer + history view will replace this placeholder.
                  </div>
                </InnerStone>

                <div className="mt-4">
                  <button
                    disabled
                    className={[
                      "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm cursor-not-allowed opacity-60",
                      moon.btnGhost,
                      "shadow-[inset_0_1px_0_rgba(255,255,255,.55)]",
                    ].join(" ")}
                  >
                    Coming soon
                  </button>
                </div>
              </Card>
            </div>

            {/* Debug */}
            <PanelChrome accent={false} className={[moon.panel2].join(" ")}>
              <div className="p-5">
                <details>
                  <summary
                    className={[
                      "cursor-pointer select-none text-[11px] tracking-[0.18em] uppercase",
                      moon.inkMute,
                    ].join(" ")}
                  >
                    Debug
                  </summary>
                  <div className="mt-4">
                    <InnerStone>
                      <pre className={["text-xs whitespace-pre overflow-auto", moon.inkMute].join(" ")}>
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
                    </InnerStone>
                  </div>
                </details>
              </div>
            </PanelChrome>
          </div>
        </div>
      </div>
    </div>
  );
}
