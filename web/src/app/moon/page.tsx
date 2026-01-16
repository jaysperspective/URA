// src/app/moon/page.tsx
import MoonClient from "./ui/MoonClient";
import MoonCalendarNavButton from "./ui/MoonCalendarNavButton";

export default function MoonPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="ura-section-label">URA</div>
            <div className="ura-page-title mt-1">Moon</div>
          </div>

          {/* Calendar toggle button */}
          <MoonCalendarNavButton />
        </div>

        <MoonClient />
      </div>
    </div>
  );
}
