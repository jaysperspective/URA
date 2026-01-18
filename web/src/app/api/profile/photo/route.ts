// src/app/api/profile/photo/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_SIZE = 400; // Max width/height in pixels
const QUALITY = 80; // JPEG quality (1-100)

// SECURITY: Explicitly define the upload directory to prevent path traversal
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "profile");

function safeExt(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return null;
}

/**
 * SECURITY: Sanitize filename to prevent path traversal attacks.
 * Only allows alphanumeric, dash, underscore, and dot characters.
 */
function sanitizeFilename(filename: string): string {
  // Remove any path components and only keep the basename
  const basename = path.basename(filename);
  // Replace any potentially dangerous characters
  return basename.replace(/[^a-zA-Z0-9._-]/g, "");
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

    // basic size guard (5MB raw upload)
    if (buf.length > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "file too large (max 5MB)" }, { status: 400 });
    }

    // Compress and resize using sharp
    // Convert to JPEG for consistent compression, resize to max 400x400
    const compressed = await sharp(buf)
      .resize(MAX_SIZE, MAX_SIZE, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: QUALITY, progressive: true })
      .toBuffer();

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // SECURITY: Generate safe filename using only user ID and timestamp
    // User ID is a database integer, timestamp is a number - both are safe
    const fname = sanitizeFilename(`${user.id}-${Date.now()}.jpg`);
    const full = path.join(UPLOAD_DIR, fname);

    // SECURITY: Verify the final path is within the upload directory
    // This prevents any path traversal even if sanitization is bypassed
    const resolvedPath = path.resolve(full);
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);
    if (!resolvedPath.startsWith(resolvedUploadDir + path.sep)) {
      return NextResponse.json({ ok: false, error: "Invalid file path" }, { status: 400 });
    }

    await fs.writeFile(full, compressed);

    const url = `/uploads/profile/${fname}`;

    // Update the profile with the new avatar URL
    await prisma.profile.update({
      where: { userId: user.id },
      data: { avatarUrl: url },
    });

    return NextResponse.json({
      ok: true,
      url,
      originalSize: buf.length,
      compressedSize: compressed.length,
      savings: `${Math.round((1 - compressed.length / buf.length) * 100)}%`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "upload failed" }, { status: 400 });
  }
}
