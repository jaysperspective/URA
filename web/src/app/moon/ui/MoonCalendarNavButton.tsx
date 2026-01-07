// src/app/moon/ui/MoonCalendarNavButton.tsx
"use client";

import dynamic from "next/dynamic";
import React from "react";

const MoonCalendarControl = dynamic(() => import("./MoonCalendarControl"), {
  ssr: false,
  loading: () => (
    <button
      className="rounded-full border p-2"
      style={{
        borderColor: "rgba(248,244,238,0.14)",
        background: "rgba(248,244,238,0.10)",
        color: "rgba(248,244,238,0.75)",
      }}
      aria-label="Moon calendar"
      title="Moon calendar"
    >
      <CalendarIcon />
    </button>
  ),
});

class SafeBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // swallow errors so /moon never blanks again
  }

  render() {
    if (this.state.hasError) {
      return (
        <button
          className="rounded-full border p-2 opacity-60"
          style={{
            borderColor: "rgba(248,244,238,0.14)",
            background: "rgba(248,244,238,0.08)",
            color: "rgba(248,244,238,0.65)",
          }}
          aria-label="Moon calendar unavailable"
          title="Moon calendar unavailable"
          disabled
        >
          <CalendarIcon />
        </button>
      );
    }
    return this.props.children;
  }
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3v3M16 3v3" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
      <path d="M8 16h.01M12 16h.01M16 16h.01" />
    </svg>
  );
}

export default function MoonCalendarNavButton() {
  return (
    <SafeBoundary>
      <MoonCalendarControl />
    </SafeBoundary>
  );
}
