// src/app/profile/actions.ts
"use server";

import { redirect } from "next/navigation";

export async function logoutAction() {
  redirect("/logout");
}

