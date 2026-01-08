// src/lib/ui/nav.tsx
import Link from "next/link";
import React from "react";

export const NAV = [
  { href: "/calendar", label: "Calendar" },
  { href: "/moon", label: "Moon" },
  { href: "/profile", label: "Profile" },
  { href: "/lunation", label: "Lunation" },
  { href: "/astrology", label: "Astrology" },
  { href: "/about", label: "About" },
] as const;

export function NavPills({
  activePath,
}: {
  activePath: (typeof NAV)[number]["href"] | string;
}) {
  return (
    <nav aria-label="Primary" className="w-full">
      {/* ✅ prevent rare horizontal overflow from long labels/padding on tiny widths */}
      <div className="flex flex-wrap items-center gap-2 max-w-full overflow-x-hidden">
        {NAV.map((item) => (
          <NavPill
            key={item.href}
            href={item.href}
            label={item.label}
            active={activePath === item.href || activePath.startsWith(item.href + "/")}
          />
        ))}
      </div>
    </nav>
  );
}

export function NavPill({
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
      aria-current={active ? "page" : undefined}
      className={[
        "group relative overflow-hidden rounded-full border transition",
        // ✅ 44px tap targets (mobile)
        "inline-flex min-h-[44px] items-center justify-center",
        "px-4 py-2",
        // Slightly more legible on mobile
        "text-sm sm:text-[15px] leading-none",
        // Wrap-safe: don't shrink into weird shapes, but also don't force overflow
        "shrink-0 max-w-full",
        // ✅ focus ring: clearer + consistent
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
      ].join(" ")}
      style={{
        borderColor: active ? "rgba(31,36,26,0.30)" : "rgba(31,36,26,0.18)",
        background: active ? "rgba(244,235,221,0.84)" : "rgba(244,235,221,0.64)",
        color: "rgba(31,36,26,0.90)",
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
          className="inline-block h-2 w-2 rounded-full opacity-80"
          style={{
            background: active ? "rgba(31,36,26,0.62)" : "rgba(31,36,26,0.45)",
          }}
        />
        {/* ✅ label won't cause overflow if something gets long later */}
        <span className="tracking-wide truncate">{label}</span>
      </span>
    </Link>
  );
}
