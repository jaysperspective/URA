// web/src/app/calendar/page.tsx
import CalendarClient from "./ui/CalendarClient";

export default function CalendarPage() {
  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% -10%, #E9F5DB 0%, #CFE1B9 55%, #B5C99A 120%)",
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <CalendarClient />
      </div>
    </div>
  );
}
