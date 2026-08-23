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
    const [
      usersResult,
      pendingTipsResult,
      flaggedPostsResult,
      newUsersResult,
      tipBreakdownResult,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM users WHERE NOT is_system_user`,
      sql`SELECT COUNT(*)::int AS count FROM tips WHERE status = 'pending'`,
      sql`SELECT COUNT(*)::int AS count FROM forum_posts WHERE status = 'flagged'`,
      sql`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= NOW() - INTERVAL '7 days' AND NOT is_system_user`,
      sql`SELECT status, category, COUNT(*)::int AS count FROM tips GROUP BY status, category ORDER BY status, category`,
    ]);

    return res.status(200).json({
      totalUsers: usersResult[0].count,
      pendingTips: pendingTipsResult[0].count,
      flaggedPosts: flaggedPostsResult[0].count,
      newUsersLast7Days: newUsersResult[0].count,
      tipsByStatusAndCategory: tipBreakdownResult,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
