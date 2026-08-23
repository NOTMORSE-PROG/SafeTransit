import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { requireAdminAuth } from "../../../services/auth/adminAuth";

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ADMIN_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") return res.status(200).end();

  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "User ID required" });

  try {
    if (req.method === "GET") {
      const [userRows, consentRows] = await Promise.all([
        sql`
          SELECT id, email, full_name, profile_image_url, phone_number,
                 is_admin, is_system_user, onboarding_completed,
                 accepted_terms_at, accepted_privacy_at, created_at, updated_at
          FROM users WHERE id = ${id} LIMIT 1
        `,
        sql`
          SELECT consent_type, accepted_at, ip_address
          FROM user_consents WHERE user_id = ${id}
          ORDER BY accepted_at DESC
        `,
      ]);
      if (userRows.length === 0) return res.status(404).json({ error: "User not found" });
      return res.status(200).json({ user: userRows[0], consents: consentRows });
    }

    if (req.method === "PUT") {
      const { is_admin } = req.body || {};
      if (typeof is_admin !== "boolean")
        return res.status(400).json({ error: "is_admin must be a boolean" });
      if (!is_admin && admin.userId === id)
        return res.status(400).json({ error: "Cannot revoke your own admin access" });

      const result = await sql`
        UPDATE users SET is_admin = ${is_admin}, updated_at = NOW()
        WHERE id = ${id} AND NOT is_system_user
        RETURNING id, email, full_name, is_admin
      `;
      if (result.length === 0)
        return res.status(404).json({ error: "User not found or is a system user" });
      return res.status(200).json({ success: true, data: result[0] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Admin user detail/update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
