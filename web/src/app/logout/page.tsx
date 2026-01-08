// src/app/logout/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/logout", { method: "GET", cache: "no-store" });
      } catch {
        // ignore
      }

      // Clear any custom client-side auth artifacts
      try {
        const keysToNuke = [
          "ura_session",
          "session",
          "sessionId",
          "sid",
          "token",
          "auth",
          "auth_token",
        ];
        for (const k of keysToNuke) {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        }
      } catch {
        // ignore
      }

      router.replace("/");
      router.refresh();
    })();
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-white/70 text-sm">Logging out…</div>
    </div>
  );
}
