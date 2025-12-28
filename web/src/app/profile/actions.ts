// src/app/profile/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  // Clear the auth session cookie
  cookies().delete("ura_session");
  redirect("/home");
}
