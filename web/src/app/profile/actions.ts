// src/app/profile/actions.ts
"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, clearSession } from "@/lib/auth";
import { deleteUserById } from "@/lib/account/deleteUser";

export async function logoutAction() {
  redirect("/logout");
}

export async function deleteAccountAction() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await deleteUserById(user.id);
  await clearSession();
  redirect("/");
}

