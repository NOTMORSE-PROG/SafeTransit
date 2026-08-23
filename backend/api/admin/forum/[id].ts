import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { requireAdminAuth } from "../../../services/auth/adminAuth";

const sql = neon(process.env.DATABASE_URL!);
const VALID_STATUSES = ["visible", "hidden", "flagged"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ADMIN_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") return res.status(200).end();

  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Post ID required" });

  try {
    if (req.method === "PUT") {
      const { status } = req.body || {};
      if (!status || !VALID_STATUSES.includes(status))
        return res.status(400).json({ error: "Invalid status value" });

      const result = await sql`
        UPDATE forum_posts SET status = ${status}, updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `;
      if (result.length === 0) return res.status(404).json({ error: "Post not found" });
      return res.status(200).json({ success: true, data: result[0] });
    }

    if (req.method === "DELETE") {
      const result = await sql`DELETE FROM forum_posts WHERE id = ${id} RETURNING id`;
      if (result.length === 0) return res.status(404).json({ error: "Post not found" });
      return res.status(200).json({ success: true, message: "Post deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Admin forum post update/delete error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
