// src/components/BottomNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/moon", label: "Moon", icon: MoonIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
  { href: "/lunation", label: "Lunation", icon: LunationIcon },
  { href: "/astrology", label: "Astrology", icon: AstrologyIcon },
  { href: "/about", label: "About", icon: AboutIcon },
] as const;

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      {active && <circle cx="12" cy="16" r="2" fill="currentColor" />}
    </svg>
  );
}

function MoonIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function LunationIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function AstrologyIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <circle cx="12" cy="12" r="4" fill={active ? "currentColor" : "none"} opacity={active ? "0.3" : "1"} />
      {active && <circle cx="12" cy="12" r="2" fill="currentColor" />}
    </svg>
  );
}

function AboutIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" fill={active ? "currentColor" : "none"} opacity={active ? "0.15" : "1"} />
      <line x1="12" y1="11" x2="12" y2="17" strokeWidth="2" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname() || "/";

  // Hide on certain routes
  const hideOnRoutes = ["/", "/login", "/signup", "/logout", "/profile/setup", "/profile/edit"];
  if (hideOnRoutes.includes(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: "linear-gradient(180deg, var(--ura-bg-secondary) 0%, rgba(46,74,65,0.98) 100%)",
        borderTop: "1px solid var(--ura-border-subtle)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto max-w-screen-lg px-2">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center justify-center py-2 px-1 min-w-[56px] transition-all"
                style={{
                  color: isActive ? "var(--ura-accent-primary)" : "var(--ura-text-muted)",
                }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-2xl transition-all"
                  style={{
                    background: isActive ? "rgba(200,178,106,0.15)" : "transparent",
                  }}
                >
                  <Icon active={isActive} />
                </div>
                <span
                  className="mt-0.5 text-[10px] tracking-wide transition-all"
                  style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "var(--ura-accent-primary)" : "var(--ura-text-muted)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
