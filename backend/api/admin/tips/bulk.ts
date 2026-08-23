import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { requireAdminAuth } from "../../../services/auth/adminAuth";
import type { TipStatus } from "../../../services/types/database";

const sql = neon(process.env.DATABASE_URL!);

const VALID_STATUSES: TipStatus[] = ["pending", "approved", "rejected", "expired"];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ADMIN_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  const { ids, status } = req.body || {};

  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ error: "ids must be a non-empty array" });
  if (ids.length > 100)
    return res.status(400).json({ error: "Cannot bulk-update more than 100 tips at once" });
  if (!status || !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid status value" });
  if (!ids.every((id: unknown) => typeof id === "string" && UUID_REGEX.test(id)))
    return res.status(400).json({ error: "All ids must be valid UUIDs" });

  try {
    const result = await sql`
      UPDATE tips
      SET status = ${status}, updated_at = NOW()
      WHERE id = ANY(${ids}::uuid[])
      RETURNING id
    `;
    return res.status(200).json({ success: true, updated: result.length });
  } catch (error) {
    console.error("Admin bulk tip update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
