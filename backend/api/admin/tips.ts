import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { requireAdminAuth } from "../../services/auth/adminAuth";
import type { TipStatus, TipCategory } from "../../services/types/database";

const sql = neon(process.env.DATABASE_URL!);

const VALID_STATUSES: TipStatus[] = ["pending", "approved", "rejected", "expired"];
const VALID_CATEGORIES: TipCategory[] = [
  "lighting", "safety", "transit", "harassment", "safe_haven", "construction",
];
const VALID_SEVERITIES = ["low", "medium", "high", "critical"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ADMIN_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"))));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: string[] = [];
    const { status, category, verified, severity } = req.query;

    if (status && VALID_STATUSES.includes(status as TipStatus)) {
      params.push(String(status));
      conditions.push(`t.status = $${params.length}`);
    }
    if (category && VALID_CATEGORIES.includes(category as TipCategory)) {
      params.push(String(category));
      conditions.push(`t.category = $${params.length}`);
    }
    if (verified === "true") conditions.push("t.verified = TRUE");
    if (verified === "false") conditions.push("t.verified = FALSE");
    if (severity && VALID_SEVERITIES.includes(severity as string)) {
      params.push(String(severity));
      conditions.push(`t.severity = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;

    const [tips, countRows] = await Promise.all([
      sql.query(`
        SELECT t.*, u.full_name AS author_name, u.email AS author_email
        FROM tips t
        JOIN users u ON t.author_id = u.id
        ${where}
        ORDER BY t.created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `, [...params, limit, offset]),
      sql.query(`SELECT COUNT(*)::int AS count FROM tips t ${where}`, params),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    return res.status(200).json({
      tips,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin tips list error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
