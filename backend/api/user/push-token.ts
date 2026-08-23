import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { verifyToken } from "../../services/auth/jwt";

const sql = neon(process.env.DATABASE_URL!);
const EXPO_TOKEN_REGEX = /^ExponentPushToken\[.+\]$|^[a-zA-Z0-9_-]{20,}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyToken(authHeader.substring(7));
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  const { token, platform } = req.body || {};
  if (!token || typeof token !== "string")
    return res.status(400).json({ error: "token is required" });
  if (!EXPO_TOKEN_REGEX.test(token))
    return res.status(400).json({ error: "Invalid push token format" });
  if (platform !== undefined && !["ios", "android"].includes(platform))
    return res.status(400).json({ error: "platform must be ios or android" });

  try {
    await sql`
      INSERT INTO device_push_tokens (user_id, token, platform)
      VALUES (${payload.userId}, ${token}, ${platform || null})
      ON CONFLICT (token) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        updated_at = NOW()
    `;
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Push token registration error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
