// web/src/app/calendar/page.tsx
import CalendarClient from "./ui/CalendarClient";

export default async function CalendarPage() {
  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5">
          <div className="text-white text-2xl font-semibold tracking-tight">
            Calendar
          </div>
          <div className="text-white/60 text-sm mt-1">
            Spring Equinox–anchored Solar Calendar with Lunar Overlay
          </div>
        </div>

        <CalendarClient />
      </div>
    </div>
  );
}
