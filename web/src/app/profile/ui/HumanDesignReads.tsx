"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";

type Tab = "chart" | "read" | "code";

type ReadData = {
  generalRead: string;
  dailyOperatingCode: string;
  generatedAt?: string;
  promptVersion?: string;
  cached?: boolean;
};

type Props = {
  children: ReactNode; // existing chart content
};

export default function HumanDesignReads({ children }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("chart");
  const [reads, setReads] = useState<ReadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchReads = useCallback(async (force: boolean) => {
    if (force) {
      setRegenerating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/human-design/reads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });

      const data = await res.json();

      if (data.status === "generating") {
        // Poll after short delay
        setTimeout(() => fetchReads(false), 3000);
        return;
      }

      if (data.ok && data.status === "ready") {
        setReads({
          generalRead: data.generalRead,
          dailyOperatingCode: data.dailyOperatingCode,
          generatedAt: data.generatedAt,
          promptVersion: data.promptVersion,
          cached: data.cached,
        });
      } else {
        setError(data.error || "Failed to generate reads");
      }
    } catch {
      setError("Failed to fetch reads");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, []);

  // Auto-fetch on first switch to read/code tab
  useEffect(() => {
    if ((activeTab === "read" || activeTab === "code") && !fetched && !loading) {
      setFetched(true);
      fetchReads(false);
    }
  }, [activeTab, fetched, loading, fetchReads]);

  const handleRegenerate = () => {
    if (regenerating) return;
    if (!confirm("Regenerate your HD read? This will replace the current one.")) return;
    fetchReads(true);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "chart", label: "Chart" },
    { key: "read", label: "General Read" },
    { key: "code", label: "Daily Code" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1.5 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              activeTab === t.key
                ? "bg-[#403A32] text-[#F8F2E8]"
                : "bg-black/5 text-[#403A32]/70 hover:bg-black/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "chart" && children}

      {activeTab === "read" && (
        <ReadPanel
          content={reads?.generalRead ?? null}
          loading={loading || regenerating}
          error={error}
          generatedAt={reads?.generatedAt}
          onRegenerate={handleRegenerate}
          regenerating={regenerating}
        />
      )}

      {activeTab === "code" && (
        <ReadPanel
          content={reads?.dailyOperatingCode ?? null}
          loading={loading || regenerating}
          error={error}
          generatedAt={reads?.generatedAt}
          onRegenerate={handleRegenerate}
          regenerating={regenerating}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReadPanel — shared display for general read & daily code
// ---------------------------------------------------------------------------

function ReadPanel({
  content,
  loading,
  error,
  generatedAt,
  onRegenerate,
  regenerating,
}: {
  content: string | null;
  loading: boolean;
  error: string | null;
  generatedAt?: string;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  if (loading && !content) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-[#403A32]/10 animate-pulse"
            style={{ width: `${70 + Math.random() * 30}%` }}
          />
        ))}
        <div className="mt-4 text-xs text-[#403A32]/50">
          Generating your read...
        </div>
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-4">
        <div className="text-sm text-[#8B6F47]">{error}</div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="mt-3 text-xs text-[#403A32]/60 underline hover:text-[#403A32] disabled:opacity-50"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-4">
        <div className="text-sm text-[#403A32]/60">
          No read available yet.
        </div>
      </div>
    );
  }

  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div>
      <div className="rounded-2xl border border-black/8 bg-[#F4EFE6] px-4 py-4">
        <div className="text-sm text-[#1F1B16] leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-[#403A32]/50">
        <span>{dateStr ? `Generated ${dateStr}` : ""}</span>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="underline hover:text-[#403A32] disabled:opacity-50"
        >
          {regenerating ? "Regenerating..." : "Regenerate"}
        </button>
      </div>
    </div>
  );
}
