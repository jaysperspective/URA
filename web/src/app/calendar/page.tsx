// web/src/app/calendar/page.tsx
import CalendarClient from "./ui/CalendarClient";

export default function CalendarPage() {
  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.95) 0%, rgba(185,176,123,0.55) 55%, rgba(113,116,79,0.45) 120%)",
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <CalendarClient />
      </div>
    </div>
  );
}
