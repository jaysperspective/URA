"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { ok: false };

type Props = {
  returnTo?: string;
};

export default function LoginForm({ returnTo }: Props) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--ura-bg-primary)" }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--ura-accent-primary)" }}
          >
            URA
          </div>
          <h1
            className="text-2xl font-semibold mt-2"
            style={{ color: "var(--ura-text-primary)" }}
          >
            Welcome back
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--ura-text-muted)" }}
          >
            Sign in to continue your orientation.
          </p>
        </div>

        {/* Card */}
        <div className="ura-card rounded-2xl p-6">
          <form action={action} className="space-y-5">
            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--ura-text-secondary)" }}
              >
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="ura-input w-full"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--ura-text-secondary)" }}
              >
                Password
              </label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="ura-input w-full"
                placeholder="Your password"
              />
            </div>

            {state?.error ? (
              <div
                className="rounded-xl px-3 py-2 text-sm"
                style={{
                  background: "rgba(181, 106, 77, 0.15)",
                  border: "1px solid rgba(181, 106, 77, 0.3)",
                  color: "var(--ura-alert)",
                }}
              >
                {state.error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="ura-btn-primary w-full py-2.5 font-medium disabled:opacity-50"
            >
              {pending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div
          className="flex items-center justify-between text-sm mt-5 px-1"
          style={{ color: "var(--ura-text-muted)" }}
        >
          <Link href="/" className="hover:opacity-80 transition-opacity">
            Back
          </Link>
          <Link
            href="/sun"
            className="hover:opacity-80 transition-opacity"
          >
            Continue as guest
          </Link>
          <Link
            href="/signup"
            className="hover:opacity-80 transition-opacity"
            style={{ color: "var(--ura-accent-secondary)" }}
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
