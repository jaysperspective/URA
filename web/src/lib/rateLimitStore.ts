// src/lib/rateLimitStore.ts
// Rate limit store abstraction supporting both in-memory and Redis backends
// Redis is loaded dynamically only when REDIS_URL is configured

export type RateLimitEntry = {
  count: number;
  windowStart: number;
};

/**
 * Interface for rate limit stores.
 * Implementations must provide get, set, and increment operations.
 */
export interface RateLimitStore {
  /**
   * Get the current rate limit entry for a key.
   */
  get(key: string): Promise<RateLimitEntry | null>;

  /**
   * Set a rate limit entry with TTL.
   */
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;

  /**
   * Increment the count for a key and return the new count.
   * If the key doesn't exist, this should create it with count=1.
   */
  increment(key: string, windowStart: number, ttlMs: number): Promise<number>;

  /**
   * Check if the store is connected and healthy.
   */
  isHealthy(): Promise<boolean>;
}

/**
 * In-memory rate limit store.
 * Suitable for single-instance deployments and development.
 */
export class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private lastCleanup = Date.now();
  private readonly cleanupIntervalMs = 60_000;

  async get(key: string): Promise<RateLimitEntry | null> {
    this.maybeCleanup();
    return this.store.get(key) ?? null;
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    this.maybeCleanup();
    this.store.set(key, entry);
  }

  async increment(key: string, windowStart: number, ttlMs: number): Promise<number> {
    this.maybeCleanup();
    const existing = this.store.get(key);

    if (existing && existing.windowStart === windowStart) {
      existing.count++;
      this.store.set(key, existing);
      return existing.count;
    }

    // New window or new key
    this.store.set(key, { count: 1, windowStart });
    return 1;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  private maybeCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupIntervalMs) return;

    // Clean up entries older than 2 minutes
    const maxAge = 2 * 60_000;
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart > maxAge) {
        this.store.delete(key);
      }
    }
    this.lastCleanup = now;
  }
}

// Generic Redis client interface (subset of ioredis methods we use)
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, px: "PX", ttl: number): Promise<string | null>;
  eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
  ping(): Promise<string>;
  quit(): Promise<string>;
  connect(): Promise<void>;
  on(event: string, callback: (...args: unknown[]) => void): void;
}

/**
 * Redis-based rate limit store.
 * Suitable for production multi-instance deployments.
 * Uses dynamic import so ioredis is only loaded when needed.
 */
class RedisStore implements RateLimitStore {
  private client: RedisClient | null = null;
  private connected = false;
  private initPromise: Promise<void> | null = null;

  constructor(private redisUrl: string) {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    try {
      const { default: Redis } = await import("ioredis");
      this.client = new Redis(this.redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      this.client.on("connect", () => {
        this.connected = true;
      });

      this.client.on("error", (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[RateLimitStore] Redis error:", message);
        this.connected = false;
      });

      this.client.on("close", () => {
        this.connected = false;
      });

      await this.client.connect();
    } catch (err) {
      console.error("[RateLimitStore] Redis initialization failed:", err);
      this.client = null;
    }
  }

  private async ensureClient(): Promise<RedisClient | null> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
    return this.client;
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const client = await this.ensureClient();
    if (!client) return null;

    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as RateLimitEntry;
    } catch (err) {
      console.error("[RateLimitStore] Redis get error:", err);
      return null;
    }
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    const client = await this.ensureClient();
    if (!client) return;

    try {
      await client.set(key, JSON.stringify(entry), "PX", ttlMs);
    } catch (err) {
      console.error("[RateLimitStore] Redis set error:", err);
    }
  }

  async increment(key: string, windowStart: number, ttlMs: number): Promise<number> {
    const client = await this.ensureClient();
    if (!client) return 1; // Fail open

    try {
      // Use Lua script for atomic get-check-increment
      const script = `
        local key = KEYS[1]
        local windowStart = tonumber(ARGV[1])
        local ttlMs = tonumber(ARGV[2])

        local data = redis.call('GET', key)
        if data then
          local entry = cjson.decode(data)
          if entry.windowStart == windowStart then
            entry.count = entry.count + 1
            redis.call('SET', key, cjson.encode(entry), 'PX', ttlMs)
            return entry.count
          end
        end

        -- New window or new key
        local newEntry = {count = 1, windowStart = windowStart}
        redis.call('SET', key, cjson.encode(newEntry), 'PX', ttlMs)
        return 1
      `;

      const result = await client.eval(
        script,
        1,
        key,
        windowStart.toString(),
        ttlMs.toString()
      );

      return Number(result);
    } catch (err) {
      console.error("[RateLimitStore] Redis increment error:", err);
      // Return 1 on error to allow the request (fail open)
      return 1;
    }
  }

  async isHealthy(): Promise<boolean> {
    const client = await this.ensureClient();
    if (!client || !this.connected) return false;
    try {
      await client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    const client = await this.ensureClient();
    if (client) {
      await client.quit();
    }
  }
}

// Global store instance
let storeInstance: RateLimitStore | null = null;

/**
 * Get or create the rate limit store.
 * Uses Redis if REDIS_URL is set, otherwise falls back to in-memory.
 */
export function getRateLimitStore(): RateLimitStore {
  if (storeInstance) return storeInstance;

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    console.log("[RateLimitStore] Using Redis store");
    storeInstance = new RedisStore(redisUrl);
  } else {
    console.log("[RateLimitStore] Using in-memory store (set REDIS_URL for distributed rate limiting)");
    storeInstance = new MemoryStore();
  }

  return storeInstance;
}

/**
 * Check if the current store is healthy.
 * Useful for health checks.
 */
export async function isRateLimitStoreHealthy(): Promise<boolean> {
  const store = getRateLimitStore();
  return store.isHealthy();
}
