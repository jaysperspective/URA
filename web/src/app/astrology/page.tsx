// src/app/astrology/page.tsx
import { Suspense } from "react";
import AstrologyClient from "./ui/AstrologyClient";

export default function AstrologyPage() {
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-6 py-10 text-sm opacity-80">
            Loading…
          </div>
        }
      >
        <div className="mx-auto max-w-5xl px-6 py-10">
          <AstrologyClient />
        </div>
      </Suspense>
    </main>
  );
}
