// SafeTransit backend entry point.
//
// Vercel Hobby projects have a limit on the number of Functions in one
// deployment. This dispatcher keeps the existing API paths while bundling the
// route handlers into one Function.

import type { VercelRequest, VercelResponse } from "@vercel/node";

import adminAuthHandler from "./admin/auth";
import adminDashboardHandler from "./admin/dashboard";
import adminForumHandler from "./admin/forum";
import adminForumItemHandler from "./admin/forum/[id]";
import adminNotificationsHandler from "./admin/notifications";
import adminPanelHandler from "./admin/panel";
import adminTipsHandler from "./admin/tips";
import adminTipItemHandler from "./admin/tips/[id]";
import adminTipsBulkHandler from "./admin/tips/bulk";
import adminUsersHandler from "./admin/users";
import adminUserItemHandler from "./admin/users/[id]";
import authHandler from "./auth";
import emergencyContactsHandler from "./contacts/emergency";
import familyHandler from "./family";
import forumInteractionsHandler from "./forum/interactions";
import forumPostsHandler from "./forum/posts";
import forumPostItemHandler from "./forum/posts/[id]";
import locationSearchHandler from "./locations/search";
import uploadHandler from "./uploadthing";
import locationDataHandler from "./user/location-data";
import profileHandler from "./user/profile";
import pushTokenHandler from "./user/push-token";
import savedPlacesHandler from "./user/saved-places";

type ApiHandler = (
  req: VercelRequest,
  res: VercelResponse,
) => unknown | Promise<unknown>;

const STATIC_HANDLERS: Readonly<Record<string, ApiHandler>> = {
  "admin/auth": adminAuthHandler,
  "admin/dashboard": adminDashboardHandler,
  "admin/forum": adminForumHandler,
  "admin/notifications": adminNotificationsHandler,
  "admin/panel": adminPanelHandler,
  "admin/tips": adminTipsHandler,
  "admin/tips/bulk": adminTipsBulkHandler,
  "admin/users": adminUsersHandler,
  auth: authHandler,
  "auth/google": authHandler,
  "auth/login": authHandler,
  "contacts/emergency": emergencyContactsHandler,
  family: familyHandler,
  "forum/interactions": forumInteractionsHandler,
  "forum/posts": forumPostsHandler,
  "locations/search": locationSearchHandler,
  uploadthing: uploadHandler,
  "uploadthing/index": uploadHandler,
  "user/location-data": locationDataHandler,
  "user/profile": profileHandler,
  "user/push-token": pushTokenHandler,
  "user/saved-places": savedPlacesHandler,
};

const DYNAMIC_HANDLERS: ReadonlyArray<{
  pattern: RegExp;
  handler: ApiHandler;
}> = [
  { pattern: /^admin\/forum\/([^/]+)$/, handler: adminForumItemHandler },
  { pattern: /^admin\/tips\/([^/]+)$/, handler: adminTipItemHandler },
  { pattern: /^admin\/users\/([^/]+)$/, handler: adminUserItemHandler },
  { pattern: /^forum\/posts\/([^/]+)$/, handler: forumPostItemHandler },
];

function firstQueryValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function normalizeRoute(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function renderHomepage(res: VercelResponse): void {
  res
    .status(200)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SafeTransit API</title>
  <style>
    body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 40px; max-width: 800px; margin: auto; }
    h1 { color: #fff; }
    .status { color: #4ec9b0; }
    code { color: #ce9178; }
    a { color: #4fc1ff; }
  </style>
</head>
<body>
  <h1>SafeTransit API</h1>
  <p class="status">Status: Online</p>
  <p>API routes are available below <code>/api/</code>.</p>
  <p><a href="https://github.com/NOTMORSE-PROG/SafeTransit">GitHub</a></p>
</body>
</html>`);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<unknown> {
  const route = normalizeRoute(firstQueryValue(req.query.__route));
  delete req.query.__route;

  if (route === "" || route === "index") {
    renderHomepage(res);
    return;
  }

  if (route === "health") {
    return res.status(200).json({ status: "ok", service: "safetransit-backend" });
  }

  const staticHandler = STATIC_HANDLERS[route];
  if (staticHandler) {
    return staticHandler(req, res);
  }

  for (const candidate of DYNAMIC_HANDLERS) {
    const match = candidate.pattern.exec(route);
    if (!match) {
      continue;
    }

    try {
      req.query.id = decodeURIComponent(match[1]);
    } catch {
      return res.status(400).json({ error: "Malformed route parameter" });
    }

    return candidate.handler(req, res);
  }

  return res.status(404).json({ error: "Endpoint not found" });
}
