// ---------------------------------------------------------------------------
// Simple in-memory rate limiter.
// Ponteail: single-process only. In production, use Redis-based rate limiting.
// ---------------------------------------------------------------------------

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 300_000);

/**
 * Check if a key is rate limited.
 *
 * @param key   Unique identifier (e.g., IP + route)
 * @param limit Max attempts in the window
 * @param windowMs  Window duration in milliseconds (default: 60s)
 * @returns Whether the request is allowed
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
