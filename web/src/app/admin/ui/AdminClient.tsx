"use client";

import { useMemo, useState, useActionState, useEffect } from "react";
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

type UserRow = {
  id: number;
  email: string;
  displayName: string | null;
  status: "ACTIVE" | "DISABLED" | "BANNED";
  createdAt: string;
  lastSeenAt: string | null;
  profile: {
    username: string | null;
    setupDone: boolean;
    birthPlace: string | null;
    timezone: string;
  } | null;
};

type UserPlacement = {
  id: number;
  email: string;
  displayName: string | null;
  username: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  setupDone: boolean;
  sun: string | null;
  moon: string | null;
  asc: string | null;
  createdAt: string;
};

export default function AdminClient({ unlocked, masterKey, metrics, serverHasConfig }: Props) {
  const [revealKey, setRevealKey] = useState(false);

  const [state, unlockAction, pending] = useActionState(adminUnlockAction, {
    ok: false as boolean,
    error: "",
  });

  const configOk = useMemo(
    () => serverHasConfig.hasMasterKey && serverHasConfig.hasAdminPassword && serverHasConfig.hasCookieSecret,
    [serverHasConfig]
  );

  // local admin tool state
  const [flagKey, setFlagKey] = useState("");
  const [flagDesc, setFlagDesc] = useState("");
  const [userQ, setUserQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [toast, setToast] = useState<string>("");

  // User placements state
  const [placements, setPlacements] = useState<UserPlacement[]>([]);
  const [placementsLoading, setPlacementsLoading] = useState(false);
  const [placementsLastFetch, setPlacementsLastFetch] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function refreshPage() {
    location.reload();
  }

  async function toggleFlag(key: string, enabled: boolean) {
    const res = await fetch("/api/admin/flags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setToast("Flag update failed");
      return;
    }
    setToast(`Flag ${key}: ${enabled ? "ON" : "OFF"}`);
    refreshPage();
  }

  async function createFlag() {
    const key = flagKey.trim();
    if (!key) return setToast("Enter a flag key");

    const res = await fetch("/api/admin/flags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, enabled: false, description: flagDesc.trim() || undefined }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setToast("Create flag failed");
      return;
    }
    setFlagKey("");
    setFlagDesc("");
    setToast("Flag created");
    refreshPage();
  }

  async function searchUsers() {
    setUserLoading(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userQ.trim())}&take=25`);
      const json = await res.json();
      if (!json?.ok) throw new Error("Search failed");
      setUsers(json.users || []);
    } catch {
      setToast("User search failed");
    } finally {
      setUserLoading(false);
    }
  }

  async function setUserStatus(userId: number, status: "ACTIVE" | "DISABLED" | "BANNED") {
    const res = await fetch("/api/admin/users/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, status }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setToast("Status update failed");
      return;
    }
    setToast(`User ${userId}: ${status}`);
    // update local list
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
  }

  async function fetchPlacements() {
    setPlacementsLoading(true);
    try {
      const res = await fetch("/api/admin/users/placements");
      const json = await res.json();
      if (json.ok) {
        setPlacements(json.users || []);
        setPlacementsLastFetch(new Date().toLocaleTimeString());
      } else {
        setToast("Failed to fetch placements");
      }
    } catch {
      setToast("Failed to fetch placements");
    } finally {
      setPlacementsLoading(false);
    }
  }

  // Fetch placements on mount when unlocked
  useEffect(() => {
    if (unlocked) {
      fetchPlacements();
    }
  }, [unlocked]);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh || !unlocked) return;
    const interval = setInterval(fetchPlacements, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, unlocked]);

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-5 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
              <p className="text-white/60 text-sm mt-1">Private control room (metrics, flags, tools).</p>
            </div>
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

                {state?.error ? <div className="text-sm text-red-300">{state.error}</div> : null}
              </form>

              <div className="mt-4 text-xs text-white/50">Tip: keep this password separate from your normal user login.</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/70">Includes</div>
              <div className="text-lg font-medium mt-1">Flags + Analytics + Tools</div>
              <p className="text-sm text-white/60 mt-2">
                Kill switches, top pages/features/errors, user lookup, deactivate/ban, and exports.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // unlocked view
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            <p className="text-white/60 text-sm mt-1">Control room (metrics, flags, tools).</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshPage()}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              type="button"
            >
              Refresh
            </button>

            <form
              action={async () => {
                await adminLockAction();
                location.reload();
              }}
            >
              <button
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                type="submit"
              >
                Lock
              </button>
            </form>
          </div>
        </div>

        {toast ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">{toast}</div>
        ) : null}

        <div className="mt-8 space-y-6">
          {/* Master Key */}
          <Panel title="Master Key" subtitle="Loaded from URA_MASTER_KEY (server env)">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/50">Reveal is local-only (client).</div>
              <button
                onClick={() => setRevealKey((v) => !v)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                {revealKey ? "Hide" : "Reveal"}
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-sm overflow-x-auto">
              {revealKey ? masterKey || "(empty)" : "••••••••••••••••••••••••••••••••"}
            </div>
          </Panel>

          {/* Metrics */}
          <Panel title="User Metrics" subtitle="DAU/WAU/MAU + growth + activation + churn">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Total users" value={metrics?.totalUsers ?? "—"} />
              <Stat label="DAU (24h)" value={metrics?.dau ?? "—"} />
              <Stat label="WAU (7d)" value={metrics?.wau ?? "—"} />
              <Stat label="MAU (30d)" value={metrics?.mau ?? "—"} />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="New (7d)" value={metrics?.newUsers7d ?? "—"} />
              <Stat label="New (30d)" value={metrics?.newUsers30d ?? "—"} />
              <Stat label="Setup done" value={metrics?.setupDoneCount ?? "—"} />
              <Stat label="Activation" value={metrics ? `${Math.round(metrics.activationRate01 * 100)}%` : "—"} />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Inactive >7d" value={metrics?.churn.inactive7d ?? "—"} />
              <Stat label="Inactive >14d" value={metrics?.churn.inactive14d ?? "—"} />
              <Stat label="Inactive >30d" value={metrics?.churn.inactive30d ?? "—"} />
              <Stat label="Inactive >45d" value={metrics?.churn.inactive45d ?? "—"} />
            </div>

            <div className="mt-4 text-xs text-white/50">
              Last signup: {metrics?.lastSignupAt ? fmtIso(metrics.lastSignupAt) : "—"}
            </div>
          </Panel>

          {/* User Placements */}
          <Panel title="User Placements" subtitle="All users with their Sun, Moon, and Ascendant">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchPlacements}
                  disabled={placementsLoading}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
                >
                  {placementsLoading ? "Loading..." : "Refresh"}
                </button>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  Auto-refresh (30s)
                </label>
              </div>
              <div className="text-xs text-white/50">
                {placementsLastFetch ? `Last updated: ${placementsLastFetch}` : ""}
                {placements.length > 0 ? ` · ${placements.length} users` : ""}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-12 px-4 py-2 text-xs text-white/50 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Birthday</div>
                <div className="col-span-2">Sun</div>
                <div className="col-span-2">Moon</div>
                <div className="col-span-2">ASC</div>
                <div className="col-span-1">Setup</div>
              </div>

              {placements.length === 0 ? (
                <div className="px-4 py-4 text-sm text-white/60">
                  {placementsLoading ? "Loading users..." : "No users found."}
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {placements.map((u) => (
                    <div key={u.id} className="grid grid-cols-12 px-4 py-3 text-sm items-center hover:bg-white/5">
                      <div className="col-span-3">
                        <div className="font-medium truncate">{u.displayName || u.username || u.email.split("@")[0]}</div>
                        <div className="text-xs text-white/50 font-mono truncate">{u.email}</div>
                      </div>
                      <div className="col-span-2 text-white/80">
                        {u.birthDate || "—"}
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${u.sun ? "bg-yellow-500/20 text-yellow-300" : "text-white/40"}`}>
                          {u.sun || "—"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${u.moon ? "bg-blue-500/20 text-blue-300" : "text-white/40"}`}>
                          {u.moon || "—"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${u.asc ? "bg-purple-500/20 text-purple-300" : "text-white/40"}`}>
                          {u.asc || "—"}
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        {u.setupDone ? (
                          <span className="text-green-400">Y</span>
                        ) : (
                          <span className="text-white/30">N</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-white/50">
              Showing most recent 200 users. Placements derived from natal chart data.
            </div>
          </Panel>

          {/* Feature Flags */}
          <Panel title="Feature Flags" subtitle="Global toggles + kill switches">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-1 rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-medium">Create flag</div>
                <div className="mt-3 space-y-2">
                  <input
                    value={flagKey}
                    onChange={(e) => setFlagKey(e.target.value)}
                    placeholder='key e.g. "moon_page"'
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                  />
                  <input
                    value={flagDesc}
                    onChange={(e) => setFlagDesc(e.target.value)}
                    placeholder="description (optional)"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                  />
                  <button
                    onClick={createFlag}
                    className="w-full rounded-lg bg-white text-black px-3 py-2 text-sm font-medium"
                  >
                    Create
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2 text-xs text-white/50 border-b border-white/10">
                  <div className="col-span-6">Key</div>
                  <div className="col-span-3">Updated</div>
                  <div className="col-span-3 text-right">Toggle</div>
                </div>

                {(metrics?.flags ?? []).length === 0 ? (
                  <div className="px-4 py-4 text-sm text-white/60">No flags yet.</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {(metrics?.flags ?? []).map((f) => (
                      <div key={f.key} className="grid grid-cols-12 px-4 py-3 text-sm items-center">
                        <div className="col-span-6 font-mono">{f.key}</div>
                        <div className="col-span-3 text-white/70">{fmtIso(f.updatedAt)}</div>
                        <div className="col-span-3 flex justify-end">
                          <button
                            onClick={() => toggleFlag(f.key, !f.enabled)}
                            className={`rounded-lg border px-3 py-1.5 text-sm ${
                              f.enabled
                                ? "border-green-500/40 bg-green-500/10"
                                : "border-white/15 bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            {f.enabled ? "ON" : "OFF"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Analytics */}
          <Panel title="Analytics" subtitle="Top pages/features/errors and slow endpoints">
            <div className="grid gap-3 lg:grid-cols-2">
              <MiniTable
                title="Top Pages"
                cols={["Path", "Count"]}
                rows={(metrics?.topPages ?? []).map((r) => [r.path, String(r.count)])}
              />
              <MiniTable
                title="Top Features"
                cols={["Name", "Count"]}
                rows={(metrics?.topFeatures ?? []).map((r) => [r.name, String(r.count)])}
              />
              <MiniTable
                title="Top Errors"
                cols={["Key", "Count"]}
                rows={(metrics?.topErrors ?? []).map((r) => [r.key, String(r.count)])}
              />
              <MiniTable
                title="Slow Endpoints (sample)"
                cols={["Name", "avg", "p95", "n"]}
                rows={(metrics?.slowEndpoints ?? []).map((r) => [
                  r.name,
                  `${r.avgMs}ms`,
                  `${r.p95Ms}ms`,
                  String(r.n),
                ])}
              />
            </div>

            <div className="mt-4 text-xs text-white/50">
              Slow endpoints are derived from recent timing events (sample window).
            </div>
          </Panel>

          {/* Health */}
          <Panel title="System Health" subtitle="Latest health checks per service">
            <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2 text-xs text-white/50 border-b border-white/10">
                <div className="col-span-4">Service</div>
                <div className="col-span-2">OK</div>
                <div className="col-span-3">Latency</div>
                <div className="col-span-3">Checked</div>
              </div>

              {(metrics?.healthLatest ?? []).length === 0 ? (
                <div className="px-4 py-4 text-sm text-white/60">No health checks yet.</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {(metrics?.healthLatest ?? []).map((h) => (
                    <div key={h.serviceKey} className="grid grid-cols-12 px-4 py-3 text-sm">
                      <div className="col-span-4 font-mono">{h.serviceKey}</div>
                      <div className="col-span-2">{h.ok ? "✅" : "❌"}</div>
                      <div className="col-span-3 text-white/70">{h.latencyMs == null ? "—" : `${h.latencyMs}ms`}</div>
                      <div className="col-span-3 text-white/70">{fmtIso(h.checkedAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={async () => {
                  await fetch("/api/health/ping", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ serviceKey: "db" }),
                  }).catch(() => {});
                  setToast("Health ping sent");
                  refreshPage();
                }}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                Ping DB
              </button>
            </div>
          </Panel>

          {/* Admin Tools */}
          <Panel title="Admin Tools" subtitle="User lookup, status control, exports">
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="lg:col-span-1 rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-medium">User lookup</div>
                <div className="mt-3 space-y-2">
                  <input
                    value={userQ}
                    onChange={(e) => setUserQ(e.target.value)}
                    placeholder="email / displayName / username"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/25"
                  />
                  <button
                    onClick={searchUsers}
                    className="w-full rounded-lg bg-white text-black px-3 py-2 text-sm font-medium disabled:opacity-60"
                    disabled={userLoading}
                  >
                    {userLoading ? "Searching..." : "Search"}
                  </button>

                  <div className="pt-2 border-t border-white/10">
                    <div className="text-sm font-medium">Exports</div>
                    <div className="mt-2 grid gap-2">
                      <a
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 text-center"
                        href="/api/admin/export/users"
                      >
                        Download users JSON
                      </a>
                      <a
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 text-center"
                        href="/api/admin/export/events?days=14"
                      >
                        Download events (14d)
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2 text-xs text-white/50 border-b border-white/10">
                  <div className="col-span-4">User</div>
                  <div className="col-span-3">Status</div>
                  <div className="col-span-3">Last seen</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {users.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-white/60">Search results show here.</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {users.map((u) => (
                      <div key={u.id} className="grid grid-cols-12 px-4 py-3 text-sm items-center">
                        <div className="col-span-4">
                          <div className="font-medium">{u.displayName || u.profile?.username || u.email}</div>
                          <div className="text-xs text-white/50 font-mono">{u.email}</div>
                          <div className="text-xs text-white/50">
                            {u.profile?.setupDone ? "setup✅" : "setup—"} · {u.profile?.birthPlace || "—"}
                          </div>
                        </div>

                        <div className="col-span-3 font-mono">{u.status}</div>

                        <div className="col-span-3 text-white/70">{u.lastSeenAt ? fmtIso(u.lastSeenAt) : "—"}</div>

                        <div className="col-span-2 flex justify-end gap-2">
                          <button
                            onClick={() => setUserStatus(u.id, "ACTIVE")}
                            className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => setUserStatus(u.id, "DISABLED")}
                            className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs"
                          >
                            Disable
                          </button>
                          <button
                            onClick={() => setUserStatus(u.id, "BANNED")}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs"
                          >
                            Ban
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Audit */}
          <Panel title="Admin Audit Log" subtitle="Recent admin actions">
            <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2 text-xs text-white/50 border-b border-white/10">
                <div className="col-span-3">Time</div>
                <div className="col-span-7">Action</div>
                <div className="col-span-2">Actor</div>
              </div>

              {(metrics?.recentAudit ?? []).length === 0 ? (
                <div className="px-4 py-4 text-sm text-white/60">No audit events yet.</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {(metrics?.recentAudit ?? []).map((row) => (
                    <div key={row.id} className="grid grid-cols-12 px-4 py-3 text-sm">
                      <div className="col-span-3 text-white/70">{fmtIso(row.createdAt)}</div>
                      <div className="col-span-7 font-mono">{row.action}</div>
                      <div className="col-span-2 text-white/70">{row.actor}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm text-white/70">{title}</div>
      {subtitle ? <div className="text-xs text-white/50 mt-1">{subtitle}</div> : null}
      <div className="mt-4">{children}</div>
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

function MiniTable({ title, cols, rows }: { title: string; cols: string[]; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="px-4 py-2 text-sm font-medium border-b border-white/10">{title}</div>
      <div className="grid grid-cols-12 px-4 py-2 text-xs text-white/50 border-b border-white/10">
        {cols.map((c, i) => (
          <div key={i} className={i === 0 ? "col-span-8" : "col-span-4 text-right"}>
            {c}
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-4 text-sm text-white/60">No data yet.</div>
      ) : (
        <div className="divide-y divide-white/10">
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-12 px-4 py-3 text-sm">
              <div className="col-span-8 font-mono">{r[0]}</div>
              <div className="col-span-4 text-right text-white/70">{r.slice(1).join(" · ")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
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
