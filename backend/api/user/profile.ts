import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { verifyToken } from "../../services/auth/jwt";
import { validatePhoneNumber } from "../../services/auth/validation";
import { UserRepository } from "../../services/repositories/userRepository";
import { UTApi } from "uploadthing/server";
import { sanitizeText, isValidURL } from "../../services/auth/inputValidation";

const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return url;
};

const sql = neon(getDatabaseUrl());

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

function extractFileKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const match = pathname.match(/\/f\/([^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  // Verify authentication for all methods
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Handle GET request - fetch user profile or consents
  if (req.method === "GET") {
    const action = req.query.action as string | undefined;

    // GET consents
    if (action === 'consents') {
      try {
        const result = await sql`
          SELECT consent_type, consent_given, consented_at, withdrawn_at
          FROM user_consents
          WHERE user_id = ${payload.userId}
        `;

        const consents: Record<string, boolean> = {};
        result.forEach((row: { consent_type: string; consent_given: boolean; withdrawn_at: string | null }) => {
          // Only include as true if consent_given is true and not withdrawn
          consents[row.consent_type] = row.consent_given && !row.withdrawn_at;
        });

        return res.status(200).json({ success: true, consents });
      } catch (error) {
        console.error('Failed to fetch consents:', error);
        return res.status(500).json({ error: 'Failed to fetch consents' });
      }
    }

    // GET profile (default)
    try {
      const user = await UserRepository.findById(payload.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          profile_image_url: user.profile_image_url,
          phone_number: user.phone_number,
          google_id: user.google_id,
          password_hash: user.password_hash,
          onboarding_completed: user.onboarding_completed,
        },
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  // Handle DELETE request - delete account
  if (req.method === "DELETE") {
    const action = req.query.action as string | undefined;

    if (action === 'delete') {
      try {
        // Get user to find profile image
        const user = await UserRepository.findById(payload.userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Delete profile image from UploadThing if exists
        if (user.profile_image_url) {
          const fileKey = extractFileKey(user.profile_image_url);
          if (fileKey) {
            try {
              await utapi.deleteFiles([fileKey]);
            } catch (deleteError) {
              console.error('Failed to delete profile image:', deleteError);
            }
          }
        }

        // Log deletion request
        await sql`
          INSERT INTO data_deletion_requests (user_id, status)
          VALUES (${payload.userId}, 'completed')
        `;

        // Delete user (CASCADE will handle related data)
        await sql`DELETE FROM users WHERE id = ${payload.userId}`;

        return res.status(200).json({
          success: true,
          message: 'Account deleted successfully',
        });
      } catch (error) {
        console.error('Account deletion error:', error);
        return res.status(500).json({ error: 'Failed to delete account' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only PUT and POST allowed for updates
  if (req.method !== "PUT" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = req.query.action as string | undefined;

  // POST consent
  if (req.method === "POST" && action === 'consent') {
    try {
      const { consent_type, consent_given, method } = req.body;

      if (!consent_type || typeof consent_given !== 'boolean') {
        return res.status(400).json({ error: 'consent_type and consent_given are required' });
      }

      // Insert or update consent
      await sql`
        INSERT INTO user_consents (user_id, consent_type, consent_given, consent_method, consented_at, withdrawn_at)
        VALUES (${payload.userId}, ${consent_type}, ${consent_given}, ${method || 'settings'}, NOW(), NULL)
        ON CONFLICT (user_id, consent_type)
        DO UPDATE SET
          consent_given = ${consent_given},
          withdrawn_at = CASE WHEN ${consent_given} = false THEN NOW() ELSE NULL END,
          consented_at = CASE WHEN ${consent_given} = true THEN NOW() ELSE user_consents.consented_at END
      `;

      return res.status(200).json({
        success: true,
        message: 'Consent updated successfully',
      });
    } catch (error) {
      console.error('Failed to save consent:', error);
      return res.status(500).json({ error: 'Failed to save consent' });
    }
  }

  // POST data export
  if (req.method === "POST" && action === 'export') {
    try {
      // Fetch all user data
      const user = await UserRepository.findById(payload.userId);
      const locationHistory = await sql`
        SELECT * FROM user_location_history
        WHERE user_id = ${payload.userId}
        ORDER BY created_at DESC
        LIMIT 1000
      `;
      const emergencyContacts = await sql`
        SELECT * FROM emergency_contacts WHERE user_id = ${payload.userId}
      `;
      const familyMembers = await sql`
        SELECT * FROM family_members WHERE user_id = ${payload.userId}
      `;
      const forumPosts = await sql`
        SELECT * FROM forum_posts WHERE user_id = ${payload.userId}
      `;
      const consents = await sql`
        SELECT * FROM user_consents WHERE user_id = ${payload.userId}
      `;

      // Compile export data
      const exportData = {
        export_date: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          full_name: user?.full_name,
          phone_number: user?.phone_number,
          created_at: user?.created_at,
        },
        location_history: locationHistory,
        emergency_contacts: emergencyContacts.map((c: { phone_number: string; name: string }) => ({
          name: c.name,
          phone_number: c.phone_number,
        })),
        family_members: familyMembers,
        forum_posts: forumPosts,
        consents: consents,
      };

      // In production, you would upload this to a temporary storage and return a download URL
      // For MVP, we'll return the data size and a mock URL
      const exportJson = JSON.stringify(exportData, null, 2);
      const sizeInKB = (Buffer.byteLength(exportJson, 'utf8') / 1024).toFixed(2);

      // Log export request
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      await sql`
        INSERT INTO data_export_requests (user_id, status, export_url, completed_at, expires_at)
        VALUES (${payload.userId}, 'completed', 'https://example.com/export/mock-url', NOW(), ${expiresAt.toISOString()})
      `;

      return res.status(200).json({
        success: true,
        size: `${sizeInKB} KB`,
        fileCount: 1,
        exportUrl: 'https://example.com/export/mock-url',
        expiresAt: expiresAt.toISOString(),
        // In development, you can also return the data directly
        data: exportData,
      });
    } catch (error) {
      console.error('Data export error:', error);
      return res.status(500).json({ error: 'Failed to export data' });
    }
  }

  try {

    const {
      base64,
      fileName,
      mimeType,
      phoneNumber,
      fullName,
      profileImageUrl,
      removePhoto,
    } = req.body;

    // Sanitize text inputs
    const sanitizedFullName = fullName
      ? sanitizeText(fullName, 100)
      : undefined;
    const sanitizedProfileImageUrl =
      profileImageUrl && isValidURL(profileImageUrl)
        ? profileImageUrl
        : undefined;

    if (base64 && fileName) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
      ];
      const fileType = mimeType || "image/jpeg";
      if (!allowedTypes.includes(fileType)) {
        return res
          .status(400)
          .json({
            error: "Invalid file type. Only JPEG, PNG, and WEBP are allowed.",
          });
      }

      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      if (buffer.length > 4 * 1024 * 1024) {
        return res.status(400).json({ error: "File size exceeds 4MB limit" });
      }

      const file = new File([buffer], fileName, { type: fileType });
      // File size validation passed
      const uploadResult = await utapi.uploadFiles([file]);

      if (!uploadResult[0] || uploadResult[0].error) {
        console.error("Upload service error");
        return res.status(500).json({
          error: "Failed to upload file. Please try again.",
        });
      }

      const uploadedFile = uploadResult[0].data;

      return res.status(200).json({
        success: true,
        url: uploadedFile.url,
        key: uploadedFile.key,
      });
    }

    if (phoneNumber) {
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        return res
          .status(400)
          .json({ error: validation.error || "Invalid phone number" });
      }

      const updatedUser = await UserRepository.updateProfile(payload.userId, {
        phone_number: validation.formatted,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.full_name,
          profileImageUrl: updatedUser.profile_image_url,
          phoneNumber: updatedUser.phone_number,
          onboardingCompleted: updatedUser.onboarding_completed,
          hasGoogleLinked: !!updatedUser.google_id,
          hasPasswordSet: !!updatedUser.password_hash,
        },
      });
    }

    if (
      fullName === undefined &&
      profileImageUrl === undefined &&
      !removePhoto
    ) {
      return res.status(400).json({
        error:
          "At least one of fullName, profileImageUrl, phoneNumber, or removePhoto is required",
      });
    }

    const currentUser = await UserRepository.findById(payload.userId);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldImageUrl = currentUser.profile_image_url;
    const shouldDeleteOldImage =
      oldImageUrl &&
      (removePhoto || (profileImageUrl && profileImageUrl !== oldImageUrl));

    if (shouldDeleteOldImage && oldImageUrl) {
      const fileKey = extractFileKey(oldImageUrl);
      if (fileKey) {
        try {
          console.log("Deleting old profile image:", fileKey);
          await utapi.deleteFiles([fileKey]);
          console.log("Successfully deleted old profile image");
        } catch (deleteError) {
          console.error("Failed to delete old profile image:", deleteError);
        }
      }
    }

    const updateData: {
      full_name?: string;
      profile_image_url?: string | null;
    } = {};

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length < 2) {
        return res
          .status(400)
          .json({ error: "Name must be at least 2 characters" });
      }
      updateData.full_name = sanitizedFullName || fullName.trim();
    }

    if (removePhoto) {
      updateData.profile_image_url = null;
    } else if (profileImageUrl !== undefined) {
      updateData.profile_image_url =
        sanitizedProfileImageUrl || profileImageUrl;
    }

    const updatedUser = await UserRepository.updateProfile(
      payload.userId,
      updateData,
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Failed to update user" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        profileImageUrl: updatedUser.profile_image_url,
        phoneNumber: updatedUser.phone_number,
        onboardingCompleted: updatedUser.onboarding_completed,
        hasGoogleLinked: !!updatedUser.google_id,
        hasPasswordSet: !!updatedUser.password_hash,
      },
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
