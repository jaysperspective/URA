"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = { ok: false };

export default function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#333131" }}
    >
      <div className="w-full max-w-md px-6">
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-xl">
          <div className="mb-5">
            <div className="text-white text-xl font-semibold tracking-tight">
              Create your URA account
            </div>
            <div className="text-white/70 text-sm mt-1">
              Start with the basics. You’ll set your profile next.
            </div>
          </div>

          <form action={action} className="space-y-4">
            <div>
              <label className="block text-white/70 text-xs mb-1">
                Display name (optional)
              </label>
              <input
                name="displayName"
                type="text"
                autoComplete="name"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/20"
                placeholder="Joshua"
              />
            </div>

            <div>
              <label className="block text-white/70 text-xs mb-1">Email</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/20"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <label className="block text-white/70 text-xs mb-1">Password</label>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/20"
                placeholder="At least 8 characters"
              />
            </div>

            {state?.error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {state.error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-white text-black py-2 font-medium disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create account"}
            </button>

            <div className="flex items-center justify-between text-sm text-white/70 pt-1">
              <Link href="/" className="hover:text-white">
                Back
              </Link>
              <Link href="/login" className="hover:text-white">
                Already have an account? Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
