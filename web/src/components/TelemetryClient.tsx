"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateAnonId() {
  try {
    const k = "ura_anon";
    const existing = localStorage.getItem(k);
    if (existing) return existing;
    const v = crypto.randomUUID();
    localStorage.setItem(k, v);
    return v;
  } catch {
    return undefined;
  }
}

export default function TelemetryClient() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const sessionToken = getOrCreateAnonId();

    // pageview event
    fetch("/api/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "pageview",
        path: pathname,
        sessionToken,
        meta: { ts: Date.now() },
      }),
    }).catch(() => {});

    // optional: keep your lastSeenAt alive if you already have /api/seen
    fetch("/api/seen", { method: "POST" }).catch(() => {});
  }, [pathname]);

  return null;
}
