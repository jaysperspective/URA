// src/app/astrology/page.tsx
import { Suspense } from "react";
import AstrologyClient from "./ui/AstrologyClient";

function LoadingFallback() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/70">
          Loading astrology…
        </div>
      </div>
    </main>
  );
}

export default function AstrologyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AstrologyClient />
    </Suspense>
  );
}
