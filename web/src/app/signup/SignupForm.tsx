"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = { ok: false };

export default function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);

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
            Create your account
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--ura-text-muted)" }}
          >
            Start with the basics. You&apos;ll set your profile next.
          </p>
        </div>

        {/* Card */}
        <div className="ura-card rounded-2xl p-6">
          <form action={action} className="space-y-5">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--ura-text-secondary)" }}
              >
                Display name (optional)
              </label>
              <input
                name="displayName"
                type="text"
                autoComplete="name"
                className="ura-input w-full"
                placeholder="Joshua"
              />
            </div>

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
                autoComplete="new-password"
                required
                className="ura-input w-full"
                placeholder="At least 8 characters"
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
              {pending ? "Creating..." : "Create account"}
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
            href="/login"
            className="hover:opacity-80 transition-opacity"
            style={{ color: "var(--ura-accent-secondary)" }}
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
