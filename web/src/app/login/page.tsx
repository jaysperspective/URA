import Link from "next/link";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#333131] text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-white/10 bg-black/20 backdrop-blur rounded-2xl p-6 shadow">
        <h1 className="text-xl font-semibold">Log in</h1>

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-neutral-300">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-300">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              autoComplete="current-password"
            />
          </div>

          <button className="w-full rounded-xl bg-white text-black py-2 font-medium hover:opacity-90">
            Log in
          </button>
        </form>

        <div className="mt-4 text-sm text-neutral-300">
          Need an account?{" "}
          <Link href="/signup" className="underline underline-offset-4">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
