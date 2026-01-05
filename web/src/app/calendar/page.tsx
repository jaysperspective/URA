// src/app/calendar/page.tsx
import Link from "next/link";
import CalendarClient from "./ui/CalendarClient";

export default function CalendarPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Top nav */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm tracking-widest opacity-70">URA</div>

          <div className="flex items-center gap-2">
            <Link
              href="/calendar"
              className="text-sm px-3 py-2 rounded-full border border-black/10 bg-white/40"
            >
              Calendar
            </Link>
            <Link
              href="/moon"
              className="text-sm px-3 py-2 rounded-full border border-black/10 bg-white/40"
            >
              Moon
            </Link>
          </div>
        </div>

        <CalendarClient />
      </div>
    </div>
  );
}
