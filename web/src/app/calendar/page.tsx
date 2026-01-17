// src/app/calendar/page.tsx
// Permanent redirect to /sun - calendar functionality moved there
import { redirect } from "next/navigation";

export default function CalendarPage() {
  redirect("/sun");
}
