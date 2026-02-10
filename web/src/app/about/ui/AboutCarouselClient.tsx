"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SLIDES } from "./carouselData";

const PhaseAccordion = dynamic(() => import("./PhaseAccordion"), { ssr: false });
const ThresholdPanel = dynamic(() => import("./ThresholdPanel"), { ssr: false });

// ============================================
// PROGRESS DOTS
// ============================================

function ProgressDots({
  total,
  current,
  onDotClick,
}: {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className="transition-all duration-300"
          style={{
            width: current === i ? "24px" : "8px",
            height: "8px",
            borderRadius: "4px",
            background:
              current === i
                ? "var(--ura-accent-primary)"
                : "rgba(143, 158, 147, 0.4)",
          }}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ============================================
// MAIN CAROUSEL COMPONENT
// ============================================

const STORAGE_KEY = "ura-about-completed";

// Helper to check localStorage (safe for SSR)
function getInitialState(): { showThreshold: boolean; currentSlide: number } {
  if (typeof window === "undefined") {
    return { showThreshold: false, currentSlide: 0 };
  }
  try {
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (hasCompleted === "true") {
      return { showThreshold: true, currentSlide: SLIDES.length - 1 };
    }
  } catch {
    // localStorage not available
  }
  return { showThreshold: false, currentSlide: 0 };
}

export default function AboutCarouselClient() {
  // Use lazy initialization to check localStorage once on mount (client-side only)
  const [carouselState, setCarouselState] = useState(() => getInitialState());
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);
  const dragOffset = useRef(0);
  const [visualOffset, setVisualOffset] = useState(0);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const TOTAL_SLIDES = SLIDES.length;
  const SWIPE_THRESHOLD = 50;

  // Derived state
  const currentSlide = carouselState.currentSlide;
  const showThreshold = carouselState.showThreshold;

  // Hide the SSR shell once client is mounted
  useEffect(() => {
    const ssrShell = document.getElementById("ssr-first-slide");
    if (ssrShell) ssrShell.style.display = "none";
  }, []);

  // Save to localStorage when user reaches threshold
  const saveCompletionStatus = useCallback((completed: boolean) => {
    if (completed) {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // localStorage not available
      }
    }
  }, []);

  // State updaters
  const setShowThreshold = useCallback((value: boolean) => {
    setCarouselState((prev) => ({ ...prev, showThreshold: value }));
    if (value) {
      saveCompletionStatus(true);
    }
  }, [saveCompletionStatus]);

  const setCurrentSlide = useCallback((value: number) => {
    setCarouselState((prev) => ({ ...prev, currentSlide: value }));
  }, []);

  // Check if swipe is disabled (accordion open on slide 8)
  const isSwipeDisabled = currentSlide === 7 && expandedPhase !== null;

  // Handle slide transition with inertial feel
  const goToSlide = useCallback(
    (index: number, _smooth = true) => {
      if (index < 0) index = 0;
      if (index >= TOTAL_SLIDES) {
        // Past last slide - show threshold
        setShowThreshold(true);
        return;
      }
      setShowThreshold(false);
      setExpandedPhase(null);
      setCurrentSlide(index);
      setVisualOffset(0);
    },
    [TOTAL_SLIDES, setShowThreshold, setCurrentSlide]
  );

  // Touch handlers for swipe
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isSwipeDisabled) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchCurrentX.current = e.touches[0].clientX;
      isDragging.current = true;
      setIsDraggingState(true);
    },
    [isSwipeDisabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current || isSwipeDisabled) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartX.current;
      const diffY = currentY - touchStartY.current;

      // If vertical scroll is dominant, don't interfere
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
        isDragging.current = false;
        setIsDraggingState(false);
        setVisualOffset(0);
        return;
      }

      touchCurrentX.current = currentX;
      dragOffset.current = diffX;

      // Apply visual offset with resistance at edges
      let offset = diffX;
      if (
        (currentSlide === 0 && diffX > 0) ||
        (currentSlide === TOTAL_SLIDES - 1 && diffX < 0)
      ) {
        offset = diffX * 0.3; // Resistance at edges
      }
      setVisualOffset(offset);
    },
    [isSwipeDisabled, currentSlide, TOTAL_SLIDES]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || isSwipeDisabled) {
      isDragging.current = false;
      setIsDraggingState(false);
      return;
    }

    isDragging.current = false;
    setIsDraggingState(false);
    const diff = dragOffset.current;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff < 0 && currentSlide < TOTAL_SLIDES - 1) {
        goToSlide(currentSlide + 1);
      } else if (diff < 0 && currentSlide === TOTAL_SLIDES - 1) {
        // Swipe left on last slide - show threshold
        setShowThreshold(true);
      } else if (diff > 0 && showThreshold) {
        // Swipe right from threshold - go back to last slide
        setShowThreshold(false);
      } else if (diff > 0 && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }

    setVisualOffset(0);
    dragOffset.current = 0;
  }, [isSwipeDisabled, currentSlide, TOTAL_SLIDES, goToSlide, showThreshold, setShowThreshold]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isSwipeDisabled) return;
      touchStartX.current = e.clientX;
      touchCurrentX.current = e.clientX;
      isDragging.current = true;
      setIsDraggingState(true);
    },
    [isSwipeDisabled]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current || isSwipeDisabled) return;

      const diffX = e.clientX - touchStartX.current;
      touchCurrentX.current = e.clientX;
      dragOffset.current = diffX;

      let offset = diffX;
      if (
        (currentSlide === 0 && diffX > 0) ||
        (currentSlide === TOTAL_SLIDES - 1 && diffX < 0 && !showThreshold)
      ) {
        offset = diffX * 0.3;
      }
      setVisualOffset(offset);
    },
    [isSwipeDisabled, currentSlide, TOTAL_SLIDES, showThreshold]
  );

  const handleMouseUp = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      handleTouchEnd();
    }
  }, [handleTouchEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSwipeDisabled) return;
      if (e.key === "ArrowRight") {
        if (currentSlide === TOTAL_SLIDES - 1) {
          setShowThreshold(true);
        } else {
          goToSlide(currentSlide + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (showThreshold) {
          setShowThreshold(false);
        } else {
          goToSlide(currentSlide - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, isSwipeDisabled, goToSlide, showThreshold, TOTAL_SLIDES, setShowThreshold]);

  // Restart the carousel from slide 1
  const handleRestart = useCallback(() => {
    setShowThreshold(false);
    setCurrentSlide(0);
    setExpandedPhase(null);
    setVisualOffset(0);
  }, [setShowThreshold, setCurrentSlide]);

  const currentContent = SLIDES[currentSlide];
  const isSlide8 = currentSlide === 7;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col overflow-hidden select-none"
      style={{ background: "var(--ura-bg-primary)" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage: showThreshold
            ? `url('/about-slides/slide-13.webp')`
            : `url('/about-slides/slide-${String(currentSlide + 1).padStart(2, "0")}.webp')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)",
          transform: "scale(1.1)",
          opacity: 0.6,
        }}
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(36, 62, 54, 0.3) 0%, rgba(36, 62, 54, 0.7) 100%)",
        }}
      />

      {/* Main Content */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center px-6 py-8"
        style={{
          paddingTop: "calc(var(--safe-top, 0px) + 2rem)",
          paddingBottom: "calc(var(--safe-bottom, 0px) + 4rem)",
          transform: `translateX(${visualOffset * 0.3}px)`,
          transition: isDraggingState ? "none" : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {showThreshold ? (
          <ThresholdPanel onRestart={handleRestart} />
        ) : (
          <div
            className="w-full max-w-md rounded-2xl px-6 py-8"
            style={{
              background: "rgba(46, 74, 65, 0.75)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--ura-border-subtle)",
              boxShadow: "var(--ura-shadow-md)",
            }}
          >
            {/* Slide Title (only slide 1) */}
            {currentContent.title && (
              <div
                className="text-xs font-semibold uppercase tracking-widest text-center mb-2"
                style={{ color: "var(--ura-accent-primary)" }}
              >
                {currentContent.title}
              </div>
            )}

            {/* Headline */}
            <h2
              className="text-xl font-semibold text-center leading-tight"
              style={{ color: "var(--ura-text-primary)" }}
            >
              {currentContent.headline}
            </h2>

            {/* Body */}
            <div className="mt-4 space-y-3">
              {currentContent.body.map((line, i) => (
                <p
                  key={i}
                  className="text-sm text-center leading-relaxed"
                  style={{ color: "var(--ura-text-secondary)" }}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Phase Accordion (only slide 8) */}
            {isSlide8 && (
              <PhaseAccordion
                expandedPhase={expandedPhase}
                onToggle={setExpandedPhase}
              />
            )}
          </div>
        )}
      </div>

      {/* Progress Dots */}
      <div
        className="absolute bottom-0 left-0 right-0 pb-6"
        style={{ paddingBottom: "calc(var(--safe-bottom, 0px) + 1.5rem)" }}
      >
        <ProgressDots
          total={TOTAL_SLIDES}
          current={showThreshold ? TOTAL_SLIDES : currentSlide}
          onDotClick={(i) => {
            if (i < TOTAL_SLIDES) {
              setShowThreshold(false);
              goToSlide(i);
            }
          }}
        />

        {/* Swipe hint + Skip button (first slide only) */}
        {currentSlide === 0 && !showThreshold && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "rgba(200, 178, 106, 0.15)",
                border: "1px solid rgba(200, 178, 106, 0.3)",
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: "var(--ura-accent-primary)" }}
              >
                Swipe to begin
              </span>
              <svg
                className="w-5 h-5 animate-bounce-x"
                style={{ color: "var(--ura-accent-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
            <span
              className="text-xs"
              style={{ color: "var(--ura-text-muted)" }}
            >
              or use arrow keys
            </span>
          </div>
        )}

        {/* Skip button - visible on all slides except threshold */}
        {!showThreshold && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <Link
              href="/sun"
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: "rgba(200, 178, 106, 0.2)",
                border: "1px solid rgba(200, 178, 106, 0.4)",
                color: "var(--ura-accent-primary)",
              }}
            >
              Skip this orientation →
            </Link>
            <button
              onClick={() => setShowThreshold(true)}
              className="text-xs px-4 py-2 rounded-full transition-colors hover:bg-white/5"
              style={{ color: "var(--ura-text-muted)" }}
            >
              or continue to sign in
            </button>
          </div>
        )}

        {/* Accordion hint (slide 8 when collapsed) */}
        {isSlide8 && expandedPhase === null && (
          <div
            className="text-xs text-center mt-3"
            style={{ color: "var(--ura-text-muted)" }}
          >
            Tap a phase to explore
          </div>
        )}
      </div>
    </div>
  );
}
