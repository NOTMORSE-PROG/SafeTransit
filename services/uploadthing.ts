// UploadThing Client Service for React Native
// Handles direct uploads to UploadThing from the mobile app

import { getApiUrl } from "../utils/api";

/**
 * Upload a file to UploadThing via our backend
 * This uses a presigned URL approach for React Native compatibility
 */
export async function uploadProfileImage(
  file: { uri: string; name: string; type: string },
  token: string,
  onProgress?: (progress: number) => void,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const apiUrl = getApiUrl();

    // Step 1: Get presigned URL from our backend
    const presignResponse = await fetch(`${apiUrl}/api/uploadthing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-uploadthing-api-key": "true", // Signal this is an upload request
      },
      body: JSON.stringify({
        files: [{ name: file.name, type: file.type, size: 0 }], // Size will be determined
        routeConfig: "profileImage",
      }),
    });

    if (!presignResponse.ok) {
      const error = await presignResponse.json();
      return {
        success: false,
        error: error.message || "Failed to get upload URL",
      };
    }

    // For React Native, we'll use a simpler direct upload approach
    // Create FormData and upload directly
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    // Step 2: Upload to our backend which proxies to UploadThing
    const uploadResponse = await fetch(`${apiUrl}/api/user/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      return { success: false, error: error.message || "Upload failed" };
    }

    const result = await uploadResponse.json();
    onProgress?.(100);

    return { success: true, url: result.url };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload image (for forum posts, profile, etc.) using base64 encoding
 * This works with the backend /api/user/profile endpoint
 */
export async function uploadToUploadThing(
  file: { uri: string; name: string; type: string },
  token: string,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const apiUrl = getApiUrl();

    // Convert file URI to base64
    const base64Response = await fetch(file.uri);
    const blob = await base64Response.blob();

    // Convert blob to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Upload through backend using base64
    const uploadResponse = await fetch(`${apiUrl}/api/user/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        base64,
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
      }),
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse
        .json()
        .catch(() => ({ error: "Upload failed" }));
      return { success: false, error: error.error || "Upload failed" };
    }

    const result = await uploadResponse.json();
    return { success: true, url: result.url };
  } catch (error) {
    console.error("UploadThing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload forum images using FormData
 * Uses the forumImages route in uploadthing
 */
export async function uploadForumImages(
  files: { uri: string; name: string; type: string }[],
  token: string,
  onProgress?: (progress: number) => void,
): Promise<
  { success: true; urls: string[] } | { success: false; error: string }
> {
  try {
    const apiUrl = getApiUrl();

    // For React Native, we need to upload each file individually
    // or use the base64 approach since FormData with multiple files
    // can be tricky with UploadThing SDK

    const uploadPromises = files.map(async (file) => {
      // Convert file URI to base64
      const base64Response = await fetch(file.uri);
      const blob = await base64Response.blob();

      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Upload through backend's uploadthing endpoint
      const response = await fetch(`${apiUrl}/api/uploadthing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          base64,
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          route: "forumImages",
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.url;
    });

    const urls = await Promise.all(uploadPromises);
    onProgress?.(100);

    return { success: true, urls };
  } catch (error) {
    console.error("Forum image upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
