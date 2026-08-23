import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { requireAdminAuth } from "../../services/auth/adminAuth";

const sql = neon(process.env.DATABASE_URL!);
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;
type Audience = "all" | "users_with_tips" | "specific_users";

async function getTokens(audience: Audience, userIds?: string[]): Promise<string[]> {
  let rows;
  if (audience === "all") {
    rows = await sql`SELECT token FROM device_push_tokens`;
  } else if (audience === "users_with_tips") {
    rows = await sql`
      SELECT DISTINCT dpt.token FROM device_push_tokens dpt
      INNER JOIN tips t ON t.author_id = dpt.user_id
    `;
  } else if (audience === "specific_users" && userIds?.length) {
    rows = await sql`SELECT token FROM device_push_tokens WHERE user_id = ANY(${userIds}::uuid[])`;
  } else {
    return [];
  }
  return rows
    .map((row) => row.token)
    .filter((token): token is string => typeof token === "string" && token.length > 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ADMIN_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  const { title, body, audience, userIds } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: "title is required" });
  if (!body?.trim()) return res.status(400).json({ error: "body is required" });
  const validAudiences: Audience[] = ["all", "users_with_tips", "specific_users"];
  if (!validAudiences.includes(audience))
    return res.status(400).json({ error: "audience must be: all | users_with_tips | specific_users" });
  if (audience === "specific_users" && (!Array.isArray(userIds) || !userIds.length))
    return res.status(400).json({ error: "userIds required for specific_users audience" });

  try {
    const tokens = await getTokens(audience, userIds);
    if (!tokens.length) return res.status(200).json({ success: true, sentTo: 0, batches: 0 });

    const chunks: string[][] = [];
    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) chunks.push(tokens.slice(i, i + CHUNK_SIZE));

    let totalSent = 0;
    for (const chunk of chunks) {
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(chunk.map((token) => ({ to: token, title: title.trim(), body: body.trim(), sound: "default" }))),
        });
        if (response.ok) totalSent += chunk.length;
        else console.error("Expo push chunk error:", await response.text());
      } catch (e) {
        console.error("Expo push send failed:", e);
      }
    }

    return res.status(200).json({ success: true, sentTo: totalSent, batches: chunks.length });
  } catch (error) {
    console.error("Admin notifications error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
