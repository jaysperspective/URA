"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div
        className="text-4xl font-bold"
        style={{ color: "var(--ura-alert)" }}
      >
        Something went wrong
      </div>
      <p
        className="text-sm mt-3 max-w-sm"
        style={{ color: "var(--ura-text-muted)" }}
      >
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 ura-btn-primary px-6 py-2.5 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
