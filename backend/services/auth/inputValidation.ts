// Input Validation and Sanitization
// Centralized validation to prevent injection attacks

/**
 * Sanitize text input to prevent XSS
 * Removes dangerous characters and HTML tags
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .replace(/[<>\"']/g, "") // Remove angle brackets and quotes
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .substring(0, maxLength);
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase().substring(0, 255); // Max email length
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize array of URLs (for photo uploads etc)
 */
export function sanitizeURLArray(
  urls: unknown,
  maxItems: number = 10,
): string[] {
  if (!Array.isArray(urls)) {
    return [];
  }

  return urls
    .filter((url) => typeof url === "string" && isValidURL(url))
    .slice(0, maxItems);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(
  value: unknown,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
): number {
  const num = typeof value === "string" ? parseInt(value, 10) : Number(value);

  if (isNaN(num)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.floor(num)));
}

/**
 * Sanitize pagination parameters
 */
export function sanitizePagination(
  page: unknown,
  limit: unknown,
): { page: number; limit: number } {
  return {
    page: sanitizeInteger(page, 1, 10000),
    limit: sanitizeInteger(limit, 1, 100), // Max 100 items per page
  };
}
