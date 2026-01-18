// UploadThing Client Service for React Native
// Handles direct uploads to UploadThing from the mobile app

import { getApiUrl } from '../utils/api';

/**
 * Upload a file to UploadThing via our backend
 * This uses a presigned URL approach for React Native compatibility
 */
export async function uploadProfileImage(
  file: { uri: string; name: string; type: string },
  token: string,
  onProgress?: (progress: number) => void
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const apiUrl = getApiUrl();
    
    // Step 1: Get presigned URL from our backend
    const presignResponse = await fetch(`${apiUrl}/api/uploadthing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-uploadthing-api-key': 'true', // Signal this is an upload request
      },
      body: JSON.stringify({
        files: [{ name: file.name, type: file.type, size: 0 }], // Size will be determined
        routeConfig: 'profileImage',
      }),
    });

    if (!presignResponse.ok) {
      const error = await presignResponse.json();
      return { success: false, error: error.message || 'Failed to get upload URL' };
    }

    // For React Native, we'll use a simpler direct upload approach
    // Create FormData and upload directly
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    // Step 2: Upload to our backend which proxies to UploadThing
    const uploadResponse = await fetch(`${apiUrl}/api/user/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      return { success: false, error: error.message || 'Upload failed' };
    }

    const result = await uploadResponse.json();
    onProgress?.(100);
    
    return { success: true, url: result.url };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Upload profile image using direct UploadThing API
 * This converts the local URI to a blob and uploads directly
 */
export async function uploadToUploadThing(
  file: { uri: string; name: string; type: string },
  token: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const apiUrl = getApiUrl();
    
    // Read the file as base64
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, file.name);
    
    // Upload through our backend proxy
    const uploadResponse = await fetch(`${apiUrl}/api/user/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({ message: 'Upload failed' }));
      return { success: false, error: error.message || 'Upload failed' };
    }

    const result = await uploadResponse.json();
    return { success: true, url: result.url };
  } catch (error) {
    console.error('UploadThing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}
