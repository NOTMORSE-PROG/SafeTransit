// Rate Limiting Service
// Simple in-memory rate limiter for API endpoints
// For production, consider using Redis or a dedicated service like Upstash

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  },
  10 * 60 * 1000,
);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 15 * 60 * 1000, // 15 minutes default
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}:${windowMs}`;

  if (!store[key] || store[key].resetTime < now) {
    // Initialize or reset
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };

    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: store[key].resetTime,
    };
  }

  // Check if limit exceeded
  if (store[key].count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: store[key].resetTime,
    };
  }

  // Increment counter
  store[key].count++;

  return {
    allowed: true,
    remaining: limit - store[key].count,
    resetTime: store[key].resetTime,
  };
}

/**
 * Get client identifier from request
 * Uses IP address as fallback identifier
 */
export function getClientIdentifier(
  headers: Record<string, string | string[] | undefined>,
): string {
  // Try to get real IP from common proxy headers
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0];
    return ip.trim();
  }

  const realIp = headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to generic identifier
  return "unknown";
}
