// src/app/profile/edit/ui/EditProfileClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { saveProfileEditsAction } from "../actions";

type Initial = {
  username: string;
  timezone: string;
  city: string;
  state: string;
  lat: number | null;
  lon: number | null;

  birthYear: number | null;
  birthMonth: number | null;
  birthDay: number | null;
  birthHour: number | null;
  birthMinute: number | null;

  imageUrl: string | null;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] tracking-[0.18em] uppercase text-black/55 font-semibold">
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-black/15 bg-white/70 px-4 py-3 text-sm text-black/85",
        "outline-none focus:border-black/25 focus:bg-white/90",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export default function EditProfileClient({ initial }: { initial: Initial }) {
  const [imageUrl, setImageUrl] = useState<string>(initial.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const preview = useMemo(() => {
    const u = (imageUrl || "").trim();
    return u.length ? u : null;
  }, [imageUrl]);

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadErr(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch("/api/profile/photo", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || !j?.ok || typeof j?.url !== "string") {
        throw new Error(j?.error || "Upload failed");
      }
      setImageUrl(j.url);
    } catch (e: any) {
      setUploadErr(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      action={saveProfileEditsAction}
      className="rounded-3xl border border-black/10 bg-white/60 p-6 shadow-[0_18px_50px_rgba(31,36,26,0.10)]"
    >
      {/* Hidden imageUrl */}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {/* PHOTO */}
      <div className="rounded-3xl border border-black/10 bg-white/55 p-5">
        <FieldLabel>Profile Image (optional)</FieldLabel>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl border border-black/10 bg-black/5 overflow-hidden flex items-center justify-center">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="text-xs text-black/40">No photo</div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm font-semibold text-black/85">
                {preview ? "Photo linked" : "No image yet"}
              </div>
              <div className="text-xs text-black/55 break-all">
                {preview ? preview : "Upload a square image for clean UI fit."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-full border border-black/15 bg-white/70 px-4 py-2 text-sm text-black/80 hover:bg-white/90">
              {uploading ? "Uploading..." : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                disabled={uploading}
              />
            </label>

            <button
              type="button"
              className="rounded-full border border-black/15 bg-white/55 px-4 py-2 text-sm text-black/70 hover:bg-white/80"
              onClick={() => setImageUrl("")}
            >
              Remove
            </button>
          </div>
        </div>

        {uploadErr ? <div className="mt-3 text-xs text-red-700">{uploadErr}</div> : null}

        <div className="mt-4">
          <FieldLabel>Or paste an image URL</FieldLabel>
          <div className="mt-2">
            <Input
              name="imageUrlText"
              defaultValue={initial.imageUrl ?? ""}
              placeholder="https://..."
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* IDENTITY */}
      <div className="mt-4 rounded-3xl border border-black/10 bg-white/55 p-5">
        <FieldLabel>Identity</FieldLabel>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Display Name</FieldLabel>
            <div className="mt-2">
              <Input name="username" defaultValue={initial.username} placeholder="Your name" />
            </div>
          </div>

          <div>
            <FieldLabel>Timezone</FieldLabel>
            <div className="mt-2">
              <Input name="timezone" defaultValue={initial.timezone} placeholder="America/New_York" />
            </div>
          </div>

          <div>
            <FieldLabel>City</FieldLabel>
            <div className="mt-2">
              <Input name="city" defaultValue={initial.city} placeholder="City" />
            </div>
          </div>

          <div>
            <FieldLabel>State</FieldLabel>
            <div className="mt-2">
              <Input name="state" defaultValue={initial.state} placeholder="State" />
            </div>
          </div>

          <div>
            <FieldLabel>Latitude</FieldLabel>
            <div className="mt-2">
              <Input
                name="lat"
                type="number"
                step="0.000001"
                defaultValue={initial.lat ?? ""}
                placeholder="36.585"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Longitude</FieldLabel>
            <div className="mt-2">
              <Input
                name="lon"
                type="number"
                step="0.000001"
                defaultValue={initial.lon ?? ""}
                placeholder="-79.395"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BIRTH */}
      <div className="mt-4 rounded-3xl border border-black/10 bg-white/55 p-5">
        <FieldLabel>Birth Data</FieldLabel>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <FieldLabel>Year</FieldLabel>
            <div className="mt-2">
              <Input name="birthYear" type="number" defaultValue={initial.birthYear ?? ""} />
            </div>
          </div>
          <div>
            <FieldLabel>Month</FieldLabel>
            <div className="mt-2">
              <Input name="birthMonth" type="number" defaultValue={initial.birthMonth ?? ""} />
            </div>
          </div>
          <div>
            <FieldLabel>Day</FieldLabel>
            <div className="mt-2">
              <Input name="birthDay" type="number" defaultValue={initial.birthDay ?? ""} />
            </div>
          </div>
          <div>
            <FieldLabel>Hour</FieldLabel>
            <div className="mt-2">
              <Input name="birthHour" type="number" defaultValue={initial.birthHour ?? ""} />
            </div>
          </div>
          <div>
            <FieldLabel>Minute</FieldLabel>
            <div className="mt-2">
              <Input name="birthMinute" type="number" defaultValue={initial.birthMinute ?? ""} />
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-black/55">
          When you save, we refresh <span className="font-mono">natal / asc-year / lunation</span> caches.
        </div>
      </div>

      {/* SAVE */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          className="rounded-full border border-black/15 bg-black/85 px-5 py-2 text-sm text-white hover:bg-black"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}
