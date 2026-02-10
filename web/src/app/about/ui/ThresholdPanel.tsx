"use client";

import { useState } from "react";
import Link from "next/link";

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

export default function ThresholdPanel({ onRestart }: { onRestart: () => void }) {
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

        <div className="pt-4 flex flex-col items-center gap-2">
          <button
            onClick={onRestart}
            className="text-xs"
            style={{ color: "var(--ura-text-muted)" }}
          >
            Review the introduction
          </button>
          <div className="flex items-center gap-3 mt-1">
            <Link
              href="/terms"
              className="text-[10px] tracking-wide"
              style={{ color: "var(--ura-text-muted)" }}
            >
              Terms of Service
            </Link>
            <span
              className="text-[10px]"
              style={{ color: "var(--ura-text-muted)", opacity: 0.4 }}
            >
              |
            </span>
            <Link
              href="/privacy"
              className="text-[10px] tracking-wide"
              style={{ color: "var(--ura-text-muted)" }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
