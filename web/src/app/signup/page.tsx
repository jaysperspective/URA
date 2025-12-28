import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SignupForm from "./SignupForm";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.profile?.setupDone) redirect("/profile");
    redirect("/profile/setup");
  }

  return <SignupForm />;
}
