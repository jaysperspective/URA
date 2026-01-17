// src/components/BottomNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/sun", label: "Sun", icon: SunIcon },
  { href: "/moon", label: "Moon", icon: MoonIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
  { href: "/astrology", label: "Astrology", icon: AstrologyIcon },
  { href: "/about", label: "About", icon: AboutIcon },
] as const;

// Sun icon: dot-in-circle representing center/orientation (0° Aries anchor)
function SunIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" fill={active ? "currentColor" : "none"} />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
      className="z-50"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        // Solid background to prevent visual glitches during scroll
        background: "linear-gradient(180deg, #2E4A41 0%, #243E36 100%)",
        borderTop: "1px solid var(--ura-border-subtle)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        // Safe area padding for notched devices
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        // Ensure proper stacking and rendering
        transform: "translateZ(0)",
        willChange: "transform",
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
