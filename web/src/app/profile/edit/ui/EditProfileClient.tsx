// src/app/profile/edit/ui/EditProfileClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { saveProfileEditAction } from "../actions";

type Initial = {
  username: string;
  bio: string;
  timezone: string;

  city: string;
  state: string;
  birthPlace: string;
  locationLine: string;

  lat: number | null;
  lon: number | null;

  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  birthHour: number | null;
  birthMinute: number | null;

  avatarUrl: string | null;
};

const inputStyle: React.CSSProperties = {
  borderColor: "rgba(31,36,26,0.18)",
  background: "rgba(248,242,232,0.85)",
  color: "rgba(15,15,15,0.92)",
  WebkitTextFillColor: "rgba(15,15,15,0.92)",
};

export default function EditProfileClient({ initial }: { initial: Initial }) {
  const [city, setCity] = useState(initial.city);
  const [state, setState] = useState(initial.state);
  const [birthPlace, setBirthPlace] = useState(initial.birthPlace);

  const [lat, setLat] = useState<number | null>(initial.lat);
  const [lon, setLon] = useState<number | null>(initial.lon);
  const [geoLabel, setGeoLabel] = useState<string | null>(null);

  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [geoError, setGeoError] = useState<string | null>(null);

  const query = useMemo(() => {
    // Prefer explicit birthPlace label if present; else City, State
    const bp = birthPlace.trim();
    if (bp) return bp;

    const parts = [city.trim(), state.trim()].filter(Boolean);
    return parts.join(", ");
  }, [birthPlace, city, state]);

  async function resolveLocation() {
    setGeoError(null);
    setGeoLabel(null);

    const q = query.trim();
    if (!q) {
      setGeoStatus("error");
      setGeoError("Enter a birth place or city/state first.");
      return;
    }

    setGeoStatus("loading");
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setGeoStatus("error");
        setGeoError(json?.error || `Geocode failed (HTTP ${res.status})`);
        return;
      }

      const newLat = Number(json.lat);
      const newLon = Number(json.lon);

      setLat(Number.isFinite(newLat) ? newLat : null);
      setLon(Number.isFinite(newLon) ? newLon : null);
      setGeoLabel(String(json.display_name || q));
      setGeoStatus("ok");

      // If the user didn't set birthPlace explicitly, adopt the resolved label
      if (!birthPlace.trim() && typeof json.display_name === "string") {
        setBirthPlace(json.display_name);
      }
    } catch (e: any) {
      setGeoStatus("error");
      setGeoError(e?.message || "Geocode failed.");
    }
  }

  return (
    <div
      className="rounded-3xl border p-6"
      style={{
        borderColor: "rgba(31,36,26,0.16)",
        background: "rgba(244,235,221,0.86)",
        boxShadow: "0 18px 50px rgba(31,36,26,0.10)",
      }}
    >
      <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
        Profile
      </div>

      <form action={saveProfileEditAction} className="mt-5 space-y-5">
        {/* Basic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: "rgba(31,36,26,0.70)" }}>
              Display name
            </label>
            <input
              name="username"
              defaultValue={initial.username}
              className="w-full rounded-2xl border px-4 py-3 text-sm placeholder:text-black/40"
              style={inputStyle}
              placeholder="your name"
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "rgba(31,36,26,0.70)" }}>
              Timezone
            </label>
            <input
              name="timezone"
              defaultValue={initial.timezone}
              className="w-full rounded-2xl border px-4 py-3 text-sm placeholder:text-black/40"
              style={inputStyle}
              placeholder="America/New_York"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs mb-1" style={{ color: "rgba(31,36,26,0.70)" }}>
            Bio (optional)
          </label>
          <textarea
            name="bio"
            defaultValue={initial.bio}
            className="w-full rounded-2xl border px-4 py-3 text-sm placeholder:text-black/40"
            style={{ ...inputStyle, minHeight: 92 }}
            placeholder="Short bio…"
          />
        </div>

        {/* Location + Geocode */}
        <div className="rounded-2xl border px-5 py-4" style={{ borderColor: "rgba(31,36,26,0.14)", background: "rgba(248,242,232,0.72)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
                Birth place
              </div>
              <div className="mt-1 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
                Resolve lat/lon via Nominatim (required for Asc-Year / ASC).
              </div>
            </div>

            <button
              type="button"
              onClick={resolveLocation}
              className="rounded-full border px-4 py-2 text-sm"
              style={{
                borderColor: "rgba(31,36,26,0.20)",
                background: "rgba(244,235,221,0.85)",
                color: "rgba(31,36,26,0.88)",
              }}
            >
              {geoStatus === "loading" ? "Resolving…" : "Resolve"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1" style={{ color: "rgba(31,36,26,0.70)" }}>
                Birth place label (recommended)
              </label>
              <input
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-sm placeholder:text-black/40"
                style={inputStyle}
                placeholder="Danville, VA"
              />
              <input type="hidden" name="birthPlace" value={birthPlace} />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(31,36,26,0.70)" }}>
                City (fallback)
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-sm placeholder:text-black/40"
                style={inputStyle}
                placeholder="Danville"
              />
              <input type="hidden" name="city" value={city} />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(31,36,26,0.70)" }}>
                State (fallback)
              </label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-sm placeholder:text-black/40"
                style={inputStyle}
                placeholder="VA"
              />
              <input type="hidden" name="state" value={state} />
            </div>
          </div>

          <div className="mt-3 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
            Query: <span className="font-mono">{query || "—"}</span>
          </div>

          {/* hidden authoritative coords for server action */}
          <input type="hidden" name="lat" value={lat ?? ""} />
          <input type="hidden" name="lon" value={lon ?? ""} />

          <div className="mt-3">
            <div className="text-xs" style={{ color: "rgba(31,36,26,0.70)" }}>
              Resolved:
            </div>
            <div className="mt-1 text-sm" style={{ color: "rgba(31,36,26,0.85)" }}>
              {geoStatus === "ok"
                ? `${geoLabel ?? query} • lat ${lat?.toFixed(5)} • lon ${lon?.toFixed(5)}`
                : lat != null && lon != null
                ? `lat ${lat.toFixed(5)} • lon ${lon.toFixed(5)}`
                : "—"}
            </div>

            {geoStatus === "error" && geoError ? (
              <div className="mt-2 text-sm" style={{ color: "rgba(120,20,20,0.85)" }}>
                {geoError}
              </div>
            ) : null}
          </div>
        </div>

        {/* Birth data */}
        <div className="rounded-2xl border px-5 py-4" style={{ borderColor: "rgba(31,36,26,0.14)", background: "rgba(248,242,232,0.72)" }}>
          <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
            Birth data
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              ["birthYear", "Year", initial.birthYear],
              ["birthMonth", "Month", initial.birthMonth],
              ["birthDay", "Day", initial.birthDay],
              ["birthHour", "Hour", initial.birthHour],
              ["birthMinute", "Minute", initial.birthMinute],
            ].map(([name, label, val]) => (
              <div key={String(name)}>
                <label className="block text-xs mb-1" style={{ color: "rgba(31,36,26,0.70)" }}>
                  {label}
                </label>
                <input
                  name={String(name)}
                  defaultValue={val ?? ""}
                  className="w-full rounded-2xl border px-4 py-3 text-sm placeholder:text-black/40"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Avatar placeholder */}
        <div className="rounded-2xl border px-5 py-4" style={{ borderColor: "rgba(31,36,26,0.14)", background: "rgba(248,242,232,0.72)" }}>
          <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
            Profile image (optional)
          </div>
          <div className="mt-2 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
            Upload wiring next (R2/S3). For now this preserves existing URL if you already have one.
          </div>
          <input type="hidden" name="avatarUrl" value={initial.avatarUrl ?? ""} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full border px-5 py-3 text-sm"
            style={{
              borderColor: "rgba(31,36,26,0.20)",
              background: "rgba(244,235,221,0.90)",
              color: "rgba(31,36,26,0.88)",
              boxShadow: "0 10px 30px rgba(31,36,26,0.08)",
            }}
          >
            Save
          </button>

          <a
            href="/profile"
            className="rounded-full border px-5 py-3 text-sm"
            style={{
              borderColor: "rgba(31,36,26,0.16)",
              background: "rgba(248,242,232,0.85)",
              color: "rgba(31,36,26,0.78)",
            }}
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
