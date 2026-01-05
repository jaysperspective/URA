// src/app/moon/page.tsx
import MoonClient from "./ui/MoonClient";

export default function MoonPage() {
  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% -10%, rgba(210,225,255,0.10), rgba(0,0,0,0) 60%), linear-gradient(180deg, #050814 0%, #070B17 55%, #040612 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <MoonClient />
      </div>
    </div>
  );
}
