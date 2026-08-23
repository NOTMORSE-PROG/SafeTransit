import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { requireAdminAuth } from "../../../services/auth/adminAuth";
import type { TipStatus } from "../../../services/types/database";

const sql = neon(process.env.DATABASE_URL!);

const VALID_STATUSES: TipStatus[] = ["pending", "approved", "rejected", "expired"];
const VALID_VERIFICATION_SOURCES = ["community", "authority", "ai"];
const VALID_SEVERITIES = ["low", "medium", "high", "critical"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ADMIN_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") return res.status(200).end();

  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Tip ID required" });
  if (!UUID_PATTERN.test(id)) return res.status(400).json({ error: "Invalid tip ID" });

  try {
    if (req.method === "PUT") {
      const { status, verified, verification_source, severity } = req.body || {};
      const updates: string[] = [];
      const values: unknown[] = [];

      if (status !== undefined) {
        if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
        values.push(status);
        updates.push(`status = $${values.length}`);
      }
      if (verified !== undefined) {
        if (typeof verified !== "boolean") return res.status(400).json({ error: "verified must be a boolean" });
        values.push(verified);
        updates.push(`verified = $${values.length}`);
      }
      if (verification_source !== undefined) {
        if (!VALID_VERIFICATION_SOURCES.includes(verification_source))
          return res.status(400).json({ error: "Invalid verification_source" });
        values.push(verification_source);
        updates.push(`verification_source = $${values.length}`);
      }
      if (severity !== undefined) {
        if (!VALID_SEVERITIES.includes(severity)) return res.status(400).json({ error: "Invalid severity" });
        values.push(severity);
        updates.push(`severity = $${values.length}`);
      }

      if (updates.length === 0) return res.status(400).json({ error: "No valid fields to update" });
      updates.push("updated_at = NOW()");

      values.push(id);
      const result = await sql.query(
        `UPDATE tips SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`,
        values,
      );
      if (result.length === 0) return res.status(404).json({ error: "Tip not found" });
      return res.status(200).json({ success: true, data: result[0] });
    }

    if (req.method === "DELETE") {
      const result = await sql`DELETE FROM tips WHERE id = ${id} RETURNING id`;
      if (result.length === 0) return res.status(404).json({ error: "Tip not found" });
      return res.status(200).json({ success: true, message: "Tip deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Admin tip update/delete error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
