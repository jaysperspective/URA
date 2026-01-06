// src/app/profile/actions.ts
"use server";

import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/logout"; // adjust to your actual logout helper

export async function logoutAction() {
  await logout();
  redirect("/calendar");
}
