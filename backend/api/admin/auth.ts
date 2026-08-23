import type { VercelRequest, VercelResponse } from "@vercel/node";
import { UserRepository } from "../../services/repositories/userRepository";
import { comparePassword } from "../../services/auth/password";
import { generateToken } from "../../services/auth/jwt";
import {
  checkRateLimit,
  getClientIdentifier,
} from "../../services/auth/rateLimiter";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminOrigin = process.env.ADMIN_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", adminOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const clientId = getClientIdentifier(
    req.headers as Record<string, string | string[] | undefined>,
  );
  const rateLimit = checkRateLimit(`admin-login:${clientId}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: "Too many login attempts. Try again later." });
  }

  const { email, password } = req.body || {};
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await UserRepository.findByEmail(email.toLowerCase().trim());

    // Generic message to prevent account enumeration
    if (!user || !user.is_admin || !user.password_hash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({ userId: user.id, email: user.email, isAdmin: true });

    return res.status(200).json({
      success: true,
      token,
      admin: { id: user.id, email: user.email, fullName: user.full_name },
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
