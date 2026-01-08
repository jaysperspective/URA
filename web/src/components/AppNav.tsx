// src/components/AppNav.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { NAV, NavPill } from "@/lib/ui/nav";

type Props = {
  /** If true, adds a Home pill (/) before the shared NAV items */
  includeHome?: boolean;
  /** Optional override when a page wants to force an active route */
  activePathOverride?: string;
  /** Extra classes for the wrapper row */
  className?: string;
};

export default function AppNav({
  includeHome = false,
  activePathOverride,
  className = "",
}: Props) {
  const pathname = usePathname() || "/";
  const activePath = activePathOverride ?? pathname;

  const items = includeHome
    ? ([{ href: "/", label: "Home" }, ...NAV] as const)
    : NAV;

  return (
    <div className={["flex flex-wrap items-center gap-2", className].join(" ")}>
      {items.map((n) => (
        <NavPill
          key={n.href}
          href={n.href as any}
          label={n.label}
          active={activePath === n.href || activePath.startsWith(n.href + "/")}
        />
      ))}
    </div>
  );
}
