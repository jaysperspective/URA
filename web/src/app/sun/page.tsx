// src/app/sun/page.tsx
// Collective orientation page - NO auth, NO personal data, NO birth chart
import SunClient from "./ui/SunClient";

export default function SunPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5">
          <div className="ura-section-label">URA</div>
          <div className="ura-page-title mt-1">Sun</div>
          <div className="mt-1 text-xs ura-text-muted">
            Collective Frame · 0° Aries
          </div>
        </div>

        <SunClient />
      </div>
    </div>
  );
}
