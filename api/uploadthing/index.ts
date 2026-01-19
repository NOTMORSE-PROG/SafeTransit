import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createUploadthing,
  type FileRouter,
  createRouteHandler,
} from "uploadthing/server";
import { verifyToken } from "../../services/auth/jwt";

const f = createUploadthing();

export const uploadRouter = {
  profileImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        throw new Error("Invalid or expired token");
      }

      return { userId: payload.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  forumImages: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        throw new Error("Invalid or expired token");
      }

      return { userId: payload.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Forum image upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

const handlers = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
});

export default async function (req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if this is a base64 upload (for React Native)
    if (req.body && typeof req.body === "object" && "base64" in req.body) {
      const { base64, fileName, mimeType } = req.body;

      // Verify auth
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Convert base64 to buffer
      const base64Data = base64.split(",")[1] || base64;
      const buffer = Buffer.from(base64Data, "base64");

      // Upload to UploadThing directly using UTApi
      const { UTApi } = await import("uploadthing/server");
      const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

      // Create a File object from buffer
      const file = new File([buffer], fileName || "upload.jpg", {
        type: mimeType || "image/jpeg",
      });

      const uploadResult = await utapi.uploadFiles(file);

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      return res.status(200).json({
        success: true,
        url: uploadResult.data.url,
      });
    }

    // Otherwise, use the default uploadthing route handler
    const url = `https://${req.headers.host}${req.url}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(", "));
      }
    }

    const webRequest = new Request(url, {
      method: req.method,
      headers,
      body: JSON.stringify(req.body),
    });

    const response = await handlers(webRequest);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("UploadThing route error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
