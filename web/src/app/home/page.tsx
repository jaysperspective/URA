// src/app/home/page.tsx
import Link from "next/link";

type LinkCard = {
  href: string;
  label: string;
  title: string;
  desc: string;
  tone?: "stone" | "moon" | "core" | "default";
};

const LINKS: LinkCard[] = [
  {
    href: "/input",
    label: "Input",
    title: "Input Console",
    desc: "Set birth data + location once. Everything else reads from the same payload.",
    tone: "default",
  },
  {
    href: "/seasons",
    label: "Seasons",
    title: "Ascendant Year Cycle",
    desc: "Your 12×30° seasonal cycle: Season + Modality, anchored to natal ASC.",
    tone: "stone",
  },
  {
    href: "/lunation",
    label: "Lunation",
    title: "Progressed Lunation",
    desc: "Progressed Sun–Moon phase: phase, sub-phase, boundaries, and the dial.",
    tone: "moon",
  },
  {
    href: "/chart",
    label: "Chart",
    title: "Chart View",
    desc: "Wheel + placements. Natal + transit display layer.",
    tone: "default",
  },
];

const API_LINKS: LinkCard[] = [
  {
    href: "/api/core",
    label: "API",
    title: "/api/core",
    desc: "Single Core API (POST). Returns natal + asOf + derived ascYear + lunation.",
    tone: "core",
  },
  {
    href: "/api/asc-year",
    label: "API",
    title: "/api/asc-year",
    desc: "Thin wrapper over core. Returns ascYear slice + summary.",
    tone: "core",
  },
  {
    href: "/api/lunation",
    label: "API",
    title: "/api/lunation",
    desc: "Thin wrapper over core. Returns lunation slice + summary.",
    tone: "core",
  },
];

function toneClasses(tone: LinkCard["tone"]) {
  if (tone === "moon") {
    return {
      border: "border-neutral-800",
      bg: "bg-gradient-to-b from-neutral-950 to-neutral-900",
      chip: "bg-[#eae6dd] text-[#121218] border-[#d9d4ca]",
      glow: "shadow-[0_0_30px_rgba(220,215,205,0.15)]",
      title: "text-neutral-50",
      desc: "text-neutral-400",
    };
  }
  if (tone === "stone") {
    return {
      border: "border-neutral-800",
      bg: "bg-neutral-950",
      chip: "bg-neutral-900 text-neutral-100 border-neutral-800",
      glow: "shadow-[0_0_30px_rgba(219,82,166,0.10)]",
      title: "text-neutral-50",
      desc: "text-neutral-400",
    };
  }
  if (tone === "core") {
    return {
      border: "border-neutral-800",
      bg: "bg-neutral-950",
      chip: "bg-neutral-900 text-neutral-200 border-neutral-800",
      glow: "shadow-[0_0_30px_rgba(94,231,213,0.10)]",
      title: "text-neutral-50",
      desc: "text-neutral-400",
    };
  }
  return {
    border: "border-neutral-800",
    bg: "bg-neutral-950",
    chip: "bg-neutral-900 text-neutral-200 border-neutral-800",
    glow: "shadow-[0_0_30px_rgba(255,255,255,0.06)]",
    title: "text-neutral-50",
    desc: "text-neutral-400",
  };
}

function Card({ item }: { item: LinkCard }) {
  const t = toneClasses(item.tone);

  return (
    <Link
      href={item.href}
      className={[
        "group block rounded-2xl border p-5 transition",
        t.border,
        t.bg,
        "hover:translate-y-[-1px] hover:border-neutral-700 hover:bg-neutral-900/50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={["text-[18px] font-semibold leading-tight", t.title].join(" ")}>
            {item.title}
          </div>
          <div className={["mt-2 text-[13px] leading-5", t.desc].join(" ")}>
            {item.desc}
          </div>
        </div>

        <div
          className={[
            "shrink-0 rounded-xl border px-3 py-2 text-[11px] tracking-[0.18em] uppercase",
            t.chip,
            t.glow,
          ].join(" ")}
        >
          {item.label}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[12px] text-neutral-500">
        <span className="font-mono">{item.href}</span>
        <span className="opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[100svh] bg-black text-neutral-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-6xl space-y-6">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase">URA</div>
          <div className="mt-2 text-[34px] leading-[1.05] font-semibold">Home</div>
          <div className="mt-2 text-[13px] text-neutral-400 max-w-2xl">
            One doorway into the system. Pages read from the same payload. Core API drives all derived models.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/input"
              className="rounded-xl bg-neutral-100 text-black px-4 py-2 text-[12px] font-semibold hover:bg-white"
            >
              Start with Input
            </Link>
            <Link
              href="/seasons"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-[12px] hover:bg-neutral-800"
            >
              Seasons
            </Link>
            <Link
              href="/lunation"
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-[12px] hover:bg-neutral-800"
            >
              Lunation
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {LINKS.map((item) => (
            <Card key={item.href} item={item} />
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="text-[12px] tracking-[0.18em] text-neutral-400 uppercase">Developer</div>
          <div className="mt-2 text-[18px] font-semibold">API Endpoints</div>
          <div className="mt-2 text-[13px] text-neutral-400">
            These routes expect <span className="font-mono">POST</span> with your canonical{" "}
            <span className="font-mono">text/plain</span> payload.
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {API_LINKS.map((item) => (
              <Card key={item.href} item={item} />
            ))}
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 px-1">
          Tip: bookmark <span className="text-neutral-300">/home</span>.
        </div>
      </div>
    </div>
  );
}
