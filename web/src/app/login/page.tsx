import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await getCurrentUser();

  // If already logged in, redirect appropriately
  if (user) {
    // If returnTo is provided and user is set up, use it
    if (params.returnTo && user.profile?.setupDone) {
      // Validate returnTo is a relative path (security)
      const returnTo = params.returnTo.startsWith("/") ? params.returnTo : "/profile";
      redirect(returnTo);
    }
    if (user.profile?.setupDone) redirect("/profile");
    redirect("/profile/setup");
  }

  return <LoginForm returnTo={params.returnTo} />;
}
