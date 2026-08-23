import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { requireAdminAuth } from "../../services/auth/adminAuth";
import type { PostFlair } from "../../services/types/forum";

const sql = neon(process.env.DATABASE_URL!);

const VALID_STATUSES = ["visible", "hidden", "flagged"];
const VALID_FLAIRS: PostFlair[] = ["general", "routes", "questions", "experiences", "tips_advice"];

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

    const { status, flair } = req.query;
    const conditions: string[] = [];
    const params: string[] = [];

    if (status && VALID_STATUSES.includes(status as string)) {
      params.push(String(status));
      conditions.push(`fp.status = $${params.length}`);
    }
    if (flair && VALID_FLAIRS.includes(flair as PostFlair)) {
      params.push(String(flair));
      conditions.push(`fp.flair = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;

    const [posts, countRows] = await Promise.all([
      sql.query(`
        SELECT fp.*, u.full_name AS author_name, u.email AS author_email
        FROM forum_posts fp
        JOIN users u ON fp.author_id = u.id
        ${where}
        ORDER BY fp.created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `, [...params, limit, offset]),
      sql.query(`SELECT COUNT(*)::int AS count FROM forum_posts fp ${where}`, params),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    return res.status(200).json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin forum list error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
