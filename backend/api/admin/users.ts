import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { requireAdminAuth } from "../../services/auth/adminAuth";

const sql = neon(process.env.DATABASE_URL!);

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
    const search = req.query.search ? String(req.query.search).trim() : null;

    const params: string[] = [];
    const conditions = ["NOT is_system_user"];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(email ILIKE $${params.length} OR full_name ILIKE $${params.length})`);
    }
    const where = `WHERE ${conditions.join(" AND ")}`;
    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;

    const [users, countRows] = await Promise.all([
      sql.query(`
        SELECT id, email, full_name, profile_image_url, is_admin, is_system_user,
               onboarding_completed, accepted_terms_at, accepted_privacy_at, created_at
        FROM users ${where}
        ORDER BY created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `, [...params, limit, offset]),
      sql.query(`SELECT COUNT(*)::int AS count FROM users ${where}`, params),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    return res.status(200).json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
