// src/lib/profile/profileLock.ts
// In-memory lock for profile updates (per-process)
// For multi-instance deployments, use Redis or database advisory locks

const locks = new Map<number, Promise<void>>();

/**
 * Execute a function with an exclusive lock on a user's profile.
 * Prevents concurrent cache updates for the same user.
 */
export async function withProfileLock<T>(
  userId: number,
  fn: () => Promise<T>
): Promise<T> {
  // Wait for any existing lock to release
  const existingLock = locks.get(userId);
  if (existingLock) {
    await existingLock.catch(() => {}); // Ignore errors from previous attempt
  }

  // Create new lock
  let resolve: () => void;
  const lockPromise = new Promise<void>((r) => {
    resolve = r;
  });
  locks.set(userId, lockPromise);

  try {
    return await fn();
  } finally {
    resolve!();
    locks.delete(userId);
  }
}

/**
 * Check if a lock exists for a user (for debugging/monitoring).
 */
export function hasProfileLock(userId: number): boolean {
  return locks.has(userId);
}

/**
 * Get the number of active locks (for debugging/monitoring).
 */
export function getActiveLockCount(): number {
  return locks.size;
}
