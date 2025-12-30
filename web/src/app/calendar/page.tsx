// web/src/app/calendar/page.tsx
import CalendarClient from "./ui/CalendarClient";

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-6">
      <div className="mx-auto w-full max-w-5xl">
        <CalendarClient />
      </div>
    </div>
  );
}

