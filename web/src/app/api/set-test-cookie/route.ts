import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const jar = await cookies();

  jar.set("test_cookie", "hello", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 10,
  });

  return NextResponse.json({ ok: true });
}
