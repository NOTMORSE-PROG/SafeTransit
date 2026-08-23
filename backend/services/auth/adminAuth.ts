import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken, type JwtPayload } from "./jwt";

export function requireAdminAuth(
  req: VercelRequest,
  res: VercelResponse,
): JwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (!payload.isAdmin) {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return null;
  }

  return payload;
}
