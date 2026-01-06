// src/app/api/profile/photo/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

function safeExt(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return null;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "missing file" }, { status: 400 });
    }

    const ext = safeExt(file.type);
    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "unsupported image type (png/jpg/webp only)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buf = Buffer.from(bytes);

    // basic size guard (5MB)
    if (buf.length > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "file too large (max 5MB)" }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "public", "uploads", "profile");
    await fs.mkdir(dir, { recursive: true });

    const fname = `${user.id}-${Date.now()}.${ext}`;
    const full = path.join(dir, fname);

    await fs.writeFile(full, buf);

    const url = `/uploads/profile/${fname}`;
    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "upload failed" }, { status: 400 });
  }
}
