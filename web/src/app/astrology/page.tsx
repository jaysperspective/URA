// src/app/astrology/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import AstrologyClient from "./ui/AstrologyClient";

export default function AstrologyPage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <Suspense fallback={<div className="mx-auto max-w-5xl text-sm opacity-70">Loading astrology…</div>}>
        <AstrologyClient />
      </Suspense>
    </main>
  );
}
