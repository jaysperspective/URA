// src/app/profile/edit/ui/EditProfileClient.tsx
"use client";

import React, { useMemo, useState, useRef } from "react";
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

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ok && data.url) {
        setAvatarUrl(data.url);
        // Also save to localStorage for the profile page
        try {
          localStorage.setItem("ura:profileImage", data.url);
        } catch {
          // ignore
        }
      } else {
        setAvatarError(data.error || "Upload failed");
      }
    } catch (err: any) {
      setAvatarError(err?.message || "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

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

        {/* Avatar upload */}
        <div className="rounded-2xl border px-5 py-4" style={{ borderColor: "rgba(31,36,26,0.14)", background: "rgba(248,242,232,0.72)" }}>
          <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
            Profile image (optional)
          </div>
          <div className="mt-2 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
            Upload a profile photo. Images are automatically compressed and resized.
          </div>

          <div className="mt-4 flex items-center gap-4">
            {/* Preview */}
            <div
              className="h-20 w-20 rounded-2xl overflow-hidden border flex items-center justify-center"
              style={{
                borderColor: "rgba(31,36,26,0.18)",
                background: avatarUrl ? "transparent" : "rgba(80,80,80,0.8)",
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "rgba(244,235,221,0.6)" }}
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </div>

            {/* Upload button */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="rounded-full border px-4 py-2 text-sm transition"
                style={{
                  borderColor: "rgba(31,36,26,0.20)",
                  background: "rgba(244,235,221,0.85)",
                  color: "rgba(31,36,26,0.88)",
                  opacity: avatarUploading ? 0.6 : 1,
                }}
              >
                {avatarUploading ? "Uploading..." : avatarUrl ? "Change photo" : "Upload photo"}
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="ml-2 rounded-full border px-3 py-2 text-sm"
                  style={{
                    borderColor: "rgba(31,36,26,0.12)",
                    background: "transparent",
                    color: "rgba(31,36,26,0.60)",
                  }}
                >
                  Remove
                </button>
              )}

              {avatarError && (
                <div className="mt-2 text-sm" style={{ color: "rgba(180,60,60,0.9)" }}>
                  {avatarError}
                </div>
              )}

              <div className="mt-2 text-xs" style={{ color: "rgba(31,36,26,0.55)" }}>
                PNG, JPG, or WebP. Max 5MB. Will be resized to 400x400.
              </div>
            </div>
          </div>

          <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />
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
