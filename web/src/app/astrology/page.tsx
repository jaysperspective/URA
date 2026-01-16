// src/app/astrology/page.tsx
import AstrologyClient from "./ui/AstrologyClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AstrologyPage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5">
          <div className="ura-section-label">URA</div>
          <div className="ura-page-title mt-1">Astrology</div>
        </div>

        <AstrologyClient />
      </div>
    </main>
  );
}
