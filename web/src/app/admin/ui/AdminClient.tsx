"use client";

import { useMemo, useState, useActionState } from "react";
import { adminUnlockAction, adminLockAction } from "../actions";
import type { AdminMetrics } from "../metrics";

type Props = {
  unlocked: boolean;
  masterKey: string;
  metrics: AdminMetrics | null;
  serverHasConfig: {
    hasMasterKey: boolean;
    hasAdminPassword: boolean;
    hasCookieSecret: boolean;
  };
};

export default function AdminClient({ unlocked, masterKey, metrics, serverHasConfig }: Props) {
  const [revealKey, setRevealKey] = useState(false);

  const [state, unlockAction, pending] = useActionState(adminUnlockAction, { ok: false as boolean, error: "" });

  const configOk = useMemo(() => {
    return serverHasConfig.hasMasterKey && serverHasConfig.hasAdminPassword && serverHasConfig.hasCookieSecret;
  }, [serverHasConfig]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            <p className="text-white/60 text-sm mt-1">
              Private control room (metrics, keys, operations).
            </p>
          </div>

          {unlocked && (
            <form action={async () => { await adminLockAction(); location.reload(); }}>
              <button
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                type="submit"
              >
                Lock
              </button>
            </form>
          )}
        </div>

        {!configOk && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
            <div className="font-medium">Server config missing:</div>
            <ul className="mt-2 list-disc pl-5 text-white/70">
              {!serverHasConfig.hasMasterKey && <li>URA_MASTER_KEY</li>}
              {!serverHasConfig.hasAdminPassword && <li>URA_ADMIN_PASSWORD</li>}
              {!serverHasConfig.hasCookieSecret && <li>URA_ADMIN_COOKIE_SECRET</li>}
            </ul>
          </div>
        )}

        {!unlocked ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/70">Unlock</div>
              <div className="text-lg font-medium mt-1">Admin Access</div>

              <form action={unlockAction} className="mt-4 space-y-3">
                <input
                  name="password"
                  type="password"
                  placeholder="Admin password"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-lg bg-white text-black px-3 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {pending ? "Unlocking..." : "Unlock"}
                </button>

                {state?.error ? (
                  <div className="text-sm text-red-300">{state.error}</div>
                ) : null}
              </form>

              <div className="mt-4 text-xs text-white/50">
                Tip: keep this password separate from your normal user login.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/70">What you’ll see</div>
              <div className="text-lg font-medium mt-1">Keys + Metrics</div>
              <p className="text-sm text-white/60 mt-2">
                Once unlocked, you’ll see your master key, user totals, active users, and growth signals.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Master Key */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-white/70">Master Key</div>
                  <div className="text-xs text-white/50 mt-1">Loaded from URA_MASTER_KEY (server env)</div>
                </div>
                <button
                  onClick={() => setRevealKey((v) => !v)}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                >
                  {revealKey ? "Hide" : "Reveal"}
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-sm overflow-x-auto">
                {revealKey ? (masterKey || "(empty)") : "••••••••••••••••••••••••••••••••"}
              </div>
            </div>

            {/* Metrics */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/70">User Metrics</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Total signups" value={metrics?.totalUsers ?? "—"} />
                <Stat label="Active (7d)" value={metrics?.active7d ?? "—"} />
                <Stat label="New (30d)" value={metrics?.newUsers30d ?? "—"} />
                <Stat label="Last signup" value={metrics?.lastSignupAt ? fmtIso(metrics.lastSignupAt) : "—"} />
              </div>

              <div className="mt-4 text-xs text-white/50">
                “Active” uses <span className="font-mono">User.lastSeenAt</span>. If you don’t have it yet, we’ll add it.
              </div>
            </div>

            {/* Quick tools (placeholders) */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/70">Quick Tools</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Tool title="Export users (CSV)" note="Handy for backups + analytics" disabled />
                <Tool title="View audit log" note="Track admin actions + critical events" disabled />
                <Tool title="Feature flags" note="Turn modules on/off without deploy" disabled />
                <Tool title="System health" note="DB / API / cron / queues" disabled />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{String(value)}</div>
    </div>
  );
}

function Tool({ title, note, disabled }: { title: string; note: string; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      className="text-left rounded-xl border border-white/10 bg-black/30 p-4 hover:bg-black/40 disabled:opacity-50"
      type="button"
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-white/55 mt-1">{note}</div>
    </button>
  );
}

function fmtIso(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
