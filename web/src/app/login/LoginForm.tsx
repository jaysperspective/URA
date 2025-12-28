"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { ok: false };

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#333131" }}>
      <div className="w-full max-w-md px-6">
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-xl">
          <div className="mb-5">
            <div className="text-white text-xl font-semibold tracking-tight">Log in</div>
            <div className="text-white/70 text-sm mt-1">Welcome back.</div>
          </div>

          <form action={action} className="space-y-4">
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
                autoComplete="current-password"
                required
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/20"
                placeholder="Your password"
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
              {pending ? "Logging in…" : "Log in"}
            </button>

            <div className="flex items-center justify-between text-sm text-white/70 pt-1">
              <Link href="/" className="hover:text-white">
                Back
              </Link>
              <Link href="/signup" className="hover:text-white">
                Create account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
