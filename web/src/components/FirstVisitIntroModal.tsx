// src/components/FirstVisitIntroModal.tsx
"use client";

import { useEffect, useState } from "react";

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
      style={{ background: "rgba(0, 0, 0, 0.60)" }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-xl rounded-2xl border p-6"
        style={{
          background: "rgba(18, 22, 32, 0.96)",
          borderColor: "rgba(255, 255, 255, 0.10)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.50)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-start justify-between">
          <h2
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "rgba(248, 244, 238, 0.95)" }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-4 text-xl leading-none transition-opacity hover:opacity-70"
            style={{ color: "rgba(248, 244, 238, 0.60)" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          className="mt-5 text-base leading-relaxed"
          style={{
            color: "rgba(248, 244, 238, 0.85)",
            whiteSpace: "pre-wrap",
          }}
        >
          {body}
        </div>

        {/* Primary button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-6 w-full rounded-full py-3 text-sm font-semibold tracking-wide transition-all hover:opacity-90"
          style={{
            background: "rgba(248, 244, 238, 0.12)",
            color: "rgba(248, 244, 238, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
