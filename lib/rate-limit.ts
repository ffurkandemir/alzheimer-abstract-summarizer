/**
 * Simple in-memory rate limiter
 * Tracks requests per IP address with a time window
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Store request counts per IP
const rateLimitStore = new Map<string, RateLimitEntry>()

// Maximum requests per window
const MAX_REQUESTS = 10
// Time window in milliseconds (1 minute)
const WINDOW_MS = 60 * 1000

/**
 * Check if an IP address has exceeded the rate limit
 * @param ip - The IP address to check
 * @returns true if rate limit is exceeded, false otherwise
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  // If no entry exists or the window has expired, create a new entry
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
    return false
  }

  // Increment the counter
  entry.count += 1

  // Check if limit is exceeded
  if (entry.count > MAX_REQUESTS) {
    return true
  }

  return false
}

/**
 * Clean up expired entries periodically
 * This prevents memory leaks in long-running processes
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
