// src/app/astrology/page.tsx
import AstrologyClient from "./ui/AstrologyClient";

export const metadata = {
  title: "Astrology Doctrine",
};

export default function AstrologyPage() {
  return (
    <main
      className="min-h-screen px-4 py-10"
      style={{ background: "#0f1a12", color: "rgba(244,235,221,0.92)" }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Astrology Doctrine</h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(244,235,221,0.72)" }}>
            Type a placement like{" "}
            <span style={{ color: "rgba(244,235,221,0.92)", fontWeight: 600 }}>
              Mars in Virgo 6th house
            </span>{" "}
            or{" "}
            <span style={{ color: "rgba(244,235,221,0.92)", fontWeight: 600 }}>
              North Node Aquarius 11
            </span>
            .
          </p>
        </header>

        <AstrologyClient />
      </div>
    </main>
  );
}
