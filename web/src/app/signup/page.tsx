import Link from "next/link";
import { signupAction } from "./actions";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#333131] text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-white/10 bg-black/20 backdrop-blur rounded-2xl p-6 shadow">
        <h1 className="text-xl font-semibold">Create account</h1>
        <p className="text-sm text-neutral-300 mt-1">Start here. Profile setup is next.</p>

        <form action={signupAction} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-neutral-300">Display name</label>
            <input
              name="displayName"
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Joshua"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-300">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-300">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button className="w-full rounded-xl bg-white text-black py-2 font-medium hover:opacity-90">
            Create account
          </button>
        </form>

        <div className="mt-4 text-sm text-neutral-300">
          Already have one?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
