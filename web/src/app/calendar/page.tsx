// src/app/calendar/page.tsx
import CalendarClient from "./ui/CalendarClient";

export default function CalendarPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5">
          <div className="ura-section-label">URA</div>
          <div className="ura-page-title mt-1">Calendar</div>
        </div>

        <CalendarClient />
      </div>
    </div>
  );
}
