"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

// ============================================
// PHASES DATA (LOCKED - DO NOT MODIFY)
// ============================================

type Phase = {
  id: number;
  name: string;
  range: string;
  orisha: string;
  gist: string;
  functionLine: string;
  ecology: string;
  psyche: string;
  distortion: string;
  participation: string;
};

const PHASES: Phase[] = [
  {
    id: 1,
    name: "Emergence",
    range: "0°–45°",
    orisha: "Eshu",
    gist: "Energy rises from dormancy. Direction returns before clarity. Movement precedes certainty.",
    functionLine: "Initiation",
    ecology: "Threshold crossing, first motion",
    psyche: "Curiosity, responsiveness",
    distortion: "Stagnation, anxiety",
    participation: "Begin lightly; let clarity follow action",
  },
  {
    id: 2,
    name: "Establishment",
    range: "45°–90°",
    orisha: "Obatala",
    gist: "Structure forms. Boundaries are set. Ethics emerge. This phase determines whether the cycle can endure.",
    functionLine: "Stabilization",
    ecology: "Grounding, skeletal order, soil formation",
    psyche: "Regulation, restraint",
    distortion: "Fragility, future collapse",
    participation: "Build simple, sustainable structure",
  },
  {
    id: 3,
    name: "Differentiation",
    range: "90°–135°",
    orisha: "Oshun",
    gist: "Life is refined through subtle care. Attention matters. This phase sustains systems through invisible labor.",
    functionLine: "Tending",
    ecology: "Micro-life, medicinal systems",
    psyche: "Discernment, maintenance",
    distortion: "Burnout, neglect",
    participation: "Improve quality, not scale",
  },
  {
    id: 4,
    name: "Bonding",
    range: "135°–180°",
    orisha: "Yemọja",
    gist: "Containment precedes independence. Safety enables growth.",
    functionLine: "Belonging",
    ecology: "Nurseries, water systems",
    psyche: "Attachment, co-regulation",
    distortion: "Isolation, insecurity",
    participation: "Strengthen support systems",
  },
  {
    id: 5,
    name: "Assertion",
    range: "180°–225°",
    orisha: "Ṣàngó",
    gist: "Presence becomes visible. Authority carries consequence.",
    functionLine: "Execution",
    ecology: "Apex regulation",
    psyche: "Responsibility, leadership",
    distortion: "Collapse, indecision",
    participation: "Act decisively and accountably",
  },
  {
    id: 6,
    name: "Transformation",
    range: "225°–270°",
    orisha: "Oya — Ogun",
    gist: "Decay renews systems. Endings are necessary.",
    functionLine: "Release",
    ecology: "Compost, storms, scavenging",
    psyche: "Grief, surrender",
    distortion: "Stagnation, decay without renewal",
    participation: "Let go cleanly",
  },
  {
    id: 7,
    name: "Dissolution",
    range: "270°–315°",
    orisha: "Olokun",
    gist: "Individual edges soften. Context expands.",
    functionLine: "Return to scale",
    ecology: "Deep ocean cycles",
    psyche: "Ego softening",
    distortion: "Nihilism, escapism",
    participation: "Widen the frame",
  },
  {
    id: 8,
    name: "Witnessing",
    range: "315°–360°",
    orisha: "Ọ̀rúnmìlà",
    gist: "Experience converts into guidance. Wisdom emerges.",
    functionLine: "Integration",
    ecology: "Migration, pattern recognition",
    psyche: "Reflection",
    distortion: "Repetition without learning",
    participation: "Extract meaning",
  },
];

// ============================================
// SLIDE CONTENT (LOCKED - DO NOT MODIFY)
// ============================================

type SlideContent = {
  id: number;
  title?: string;
  headline: string;
  body: string[];
};

const SLIDES: SlideContent[] = [
  {
    id: 1,
    title: "URA",
    headline: "A Seasonal Orientation System",
    body: ["Knowing where you are changes how you move."],
  },
  {
    id: 2,
    headline: "The Problem of Modern Time",
    body: [
      "Modern life treats all moments the same.",
      "Living systems require different modes at different times.",
      "Constant effort produces incoherence.",
    ],
  },
  {
    id: 3,
    headline: "What URA Is",
    body: [
      "URA is a Seasonal Orientation System.",
      "It helps you recognize what phase you are moving through.",
      "Orientation precedes action.",
    ],
  },
  {
    id: 4,
    headline: "What Orientation Changes",
    body: [
      "Orientation changes how effort lands.",
      "The same action produces different results at different times.",
      "Timing determines coherence.",
    ],
  },
  {
    id: 5,
    headline: "Time as a Living Process",
    body: [
      "Time is not uniform.",
      "It moves through recurring phases of change.",
      "Living systems operate in cycles.",
    ],
  },
  {
    id: 6,
    headline: "The Ascendant Year",
    body: [
      "Your personal year begins at a precise moment.",
      "When the Sun returns to the degree rising on the eastern horizon at your birth.",
      "This is astronomical, not symbolic.",
    ],
  },
  {
    id: 7,
    headline: "Chart as Clock + Compass",
    body: [
      "The chart is a clock and a compass.",
      "It shows where you are in a cycle and how energy is oriented.",
      "It maps timing and psychological direction.",
    ],
  },
  {
    id: 8,
    headline: "The Eight Phases",
    body: [
      "The year unfolds through eight distinct phases.",
      "Each phase describes a different mode of participation.",
      "No phase is optional. Suppression creates distortion.",
    ],
  },
  {
    id: 9,
    headline: "Ecology & Psyche",
    body: [
      "Human psychology is ecological.",
      "Mental states evolved in relationship with natural cycles.",
      "Coherence depends on phase-appropriate behavior.",
    ],
  },
  {
    id: 10,
    headline: "Symbolic Interface",
    body: [
      "Symbols are tools for perception.",
      "They help the nervous system recognize patterns.",
      "Symbols are not beliefs. They are interfaces.",
    ],
  },
  {
    id: 11,
    headline: "Planetary Overlay",
    body: [
      "Planets introduce pressure.",
      "Phase context determines whether pressure builds, releases, or integrates.",
      "Pressure without context becomes distortion.",
    ],
  },
  {
    id: 12,
    headline: "Long-Form Development",
    body: [
      "Not all change happens quickly.",
      "Some inner shifts unfold across years, not days.",
      "URA tracks long-form developmental timing.",
    ],
  },
  {
    id: 13,
    headline: "Integration",
    body: [
      "Knowing what time it is changes how you move.",
      "Orientation reduces friction.",
      "Timing restores meaning.",
      "URA exists to restore temporal literacy.",
    ],
  },
];

// ============================================
// PHASE ACCORDION COMPONENT (Slide 8)
// ============================================

function PhaseAccordion({
  expandedPhase,
  onToggle,
}: {
  expandedPhase: number | null;
  onToggle: (id: number | null) => void;
}) {
  return (
    <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
      {PHASES.map((phase) => (
        <div
          key={phase.id}
          className="rounded-lg overflow-hidden"
          style={{
            background: "rgba(46, 74, 65, 0.7)",
            border: "1px solid var(--ura-border-subtle)",
          }}
        >
          <button
            onClick={() => onToggle(expandedPhase === phase.id ? null : phase.id)}
            className="w-full px-4 py-3 text-left flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-medium" style={{ color: "var(--ura-text-primary)" }}>
                Phase {phase.id} — {phase.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--ura-text-muted)" }}>
                {phase.range} · {phase.orisha}
              </div>
            </div>
            <div
              className="text-xs px-2 py-1 rounded-full"
              style={{
                background: expandedPhase === phase.id ? "var(--ura-accent-primary)" : "transparent",
                color: expandedPhase === phase.id ? "var(--ura-bg-primary)" : "var(--ura-text-muted)",
                border: expandedPhase === phase.id ? "none" : "1px solid var(--ura-border-medium)",
              }}
            >
              {expandedPhase === phase.id ? "Close" : "Open"}
            </div>
          </button>

          {expandedPhase === phase.id && (
            <div className="px-4 pb-4 space-y-3">
              <div
                className="text-sm leading-relaxed"
                style={{ color: "var(--ura-text-secondary)" }}
              >
                {phase.gist}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FieldGuideItem label="Function" value={phase.functionLine} />
                <FieldGuideItem label="Ecology" value={phase.ecology} />
                <FieldGuideItem label="Psyche" value={phase.psyche} />
                <FieldGuideItem label="Distortion" value={phase.distortion} />
              </div>

              <div
                className="rounded-lg px-3 py-2"
                style={{ background: "rgba(36, 62, 54, 0.8)" }}
              >
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--ura-text-muted)" }}
                >
                  Right Participation
                </div>
                <div
                  className="text-sm mt-1"
                  style={{ color: "var(--ura-accent-primary)" }}
                >
                  {phase.participation}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FieldGuideItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: "rgba(36, 62, 54, 0.6)" }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--ura-text-muted)" }}
      >
        {label}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--ura-text-secondary)" }}>
        {value}
      </div>
    </div>
  );
}

// ============================================
// THRESHOLD PANEL (Post-Carousel)
// ============================================

function ThresholdPanel({ onRestart }: { onRestart: () => void }) {
  const [showWhereToStart, setShowWhereToStart] = useState(false);

  return (
    <div
      className="rounded-2xl px-6 py-8"
      style={{
        background: "rgba(46, 74, 65, 0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--ura-border-subtle)",
        boxShadow: "var(--ura-shadow-lg)",
      }}
    >
      <div className="text-center">
        <div
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--ura-text-muted)" }}
        >
          Welcome to URA
        </div>
        <div
          className="text-lg font-medium mt-2"
          style={{ color: "var(--ura-text-primary)" }}
        >
          You&apos;ve oriented. Now choose how to enter.
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link href="/signup" className="block">
          <button className="ura-btn-primary w-full py-3 text-sm font-medium">
            Sign in / Create account
          </button>
        </Link>
        <div
          className="text-xs text-center"
          style={{ color: "var(--ura-text-muted)" }}
        >
          Access your personal timing and cycles.
        </div>

        <div className="pt-2">
          <Link href="/doctrine" className="block">
            <button className="ura-btn-secondary w-full py-3 text-sm font-medium">
              View the full doctrine
            </button>
          </Link>
          <div
            className="text-xs text-center mt-2"
            style={{ color: "var(--ura-text-muted)" }}
          >
            Read the complete system and foundations.
          </div>
        </div>

        <div className="pt-3 text-center">
          <button
            onClick={() => setShowWhereToStart(!showWhereToStart)}
            className="text-sm underline"
            style={{ color: "var(--ura-accent-secondary)" }}
          >
            Where to start
          </button>
        </div>

        {showWhereToStart && (
          <div
            className="mt-4 rounded-lg px-4 py-4 space-y-3"
            style={{
              background: "rgba(36, 62, 54, 0.7)",
              border: "1px solid var(--ura-border-subtle)",
            }}
          >
            <WhereToStartItem
              condition="If you want personal timing"
              action="Enter birth details to calculate your Ascendant Year"
              href="/profile/setup"
            />
            <WhereToStartItem
              condition="If you want to understand the system"
              action="Read the doctrine and explore the eight phases"
              href="/doctrine"
            />
            <WhereToStartItem
              condition="If you want daily grounding"
              action="Begin with today's phase"
              href="/calendar"
            />
          </div>
        )}

        <div className="pt-4 text-center">
          <button
            onClick={onRestart}
            className="text-xs"
            style={{ color: "var(--ura-text-muted)" }}
          >
            Review the introduction
          </button>
        </div>
      </div>
    </div>
  );
}

function WhereToStartItem({
  condition,
  action,
  href,
}: {
  condition: string;
  action: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="group">
        <div
          className="text-xs font-medium"
          style={{ color: "var(--ura-text-muted)" }}
        >
          {condition} →
        </div>
        <div
          className="text-sm mt-0.5 group-hover:underline"
          style={{ color: "var(--ura-text-primary)" }}
        >
          {action}
        </div>
      </div>
    </Link>
  );
}

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

export default function AboutCarousel() {
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
    (index: number, smooth = true) => {
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
  }, [isSwipeDisabled, currentSlide, TOTAL_SLIDES, goToSlide, showThreshold]);

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
            ? `url('/about-slides/slide-13.png')`
            : `url('/about-slides/slide-${String(currentSlide + 1).padStart(2, "0")}.png')`,
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

        {/* Swipe hint (first slide only) */}
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
