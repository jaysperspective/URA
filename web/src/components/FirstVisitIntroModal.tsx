// src/components/FirstVisitIntroModal.tsx
"use client";

import { useEffect, useState } from "react";

// URA color palette (matches site aesthetic)
const C = {
  moonstone: "#F8F4EE",
  ink: "rgba(18,22,32,0.92)",
  inkMuted: "rgba(18,22,32,0.70)",
  inkSoft: "rgba(18,22,32,0.52)",
  border: "rgba(18,22,32,0.14)",
  shadow: "0 26px 90px rgba(0,0,0,0.35)",
};

type FirstVisitIntroModalProps = {
  storageKey: string;
  title: string;
  body: string;
};

export default function FirstVisitIntroModal({
  storageKey,
  title,
  body,
}: FirstVisitIntroModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check localStorage to see if user has already seen this intro
    try {
      const seen = localStorage.getItem(storageKey);
      if (!seen) {
        setIsOpen(true);
      }
    } catch {
      // localStorage unavailable (e.g., private browsing, SSR edge case)
      // Fail gracefully: do not show modal
    }
  }, [storageKey]);

  function handleDismiss() {
    setIsOpen(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // localStorage unavailable - fail gracefully
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  }

  // Don't render anything until mounted (avoids hydration mismatch)
  // Don't render if modal is closed
  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(18, 22, 32, 0.55)" }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-3xl border px-6 py-7"
        style={{
          background: "linear-gradient(180deg, rgba(248,244,238,0.98) 0%, rgba(239,231,221,0.96) 55%, rgba(231,221,209,0.94) 100%)",
          borderColor: C.border,
          boxShadow: C.shadow,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-start justify-between">
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: C.ink }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-4 text-xl leading-none transition-opacity hover:opacity-60"
            style={{ color: C.inkSoft }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          className="mt-5 text-base leading-relaxed"
          style={{
            color: C.inkMuted,
            whiteSpace: "pre-wrap",
          }}
        >
          {body}
        </div>

        {/* Primary button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-6 w-full rounded-full py-3 text-sm font-semibold tracking-wide transition-all hover:opacity-80"
          style={{
            background: "rgba(18,22,32,0.08)",
            color: C.ink,
            border: `1px solid ${C.border}`,
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
