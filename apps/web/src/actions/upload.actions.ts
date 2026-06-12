'use server';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Upload an event banner image.
 * Takes a FormData object with a 'file' field.
 */
export async function uploadEventBannerAction(
  formData: FormData,
  accessToken: string
): Promise<ActionResult<UploadResult>> {
  try {
    const response = await fetch(`${API_URL}/upload/event-banner`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: UploadResult;
      error?: { message: string };
    };

    if (!response.ok || !data.success || !data.data) {
      return { success: false, error: data.error?.message ?? 'Upload failed' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Upload an event thumbnail image.
 */
export async function uploadEventThumbnailAction(
  formData: FormData,
  accessToken: string
): Promise<ActionResult<UploadResult>> {
  try {
    const response = await fetch(`${API_URL}/upload/event-thumbnail`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: UploadResult;
      error?: { message: string };
    };

    if (!response.ok || !data.success || !data.data) {
      return { success: false, error: data.error?.message ?? 'Upload failed' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Upload a user avatar.
 */
export async function uploadAvatarAction(
  formData: FormData,
  accessToken: string
): Promise<ActionResult<UploadResult>> {
  try {
    const response = await fetch(`${API_URL}/upload/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: UploadResult;
      error?: { message: string };
    };

    if (!response.ok || !data.success || !data.data) {
      return { success: false, error: data.error?.message ?? 'Upload failed' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Delete a Cloudinary asset by its publicId.
 * The publicId is base64url-encoded for safe URL transmission.
 */
export async function deleteAssetAction(
  publicId: string,
  accessToken: string
): Promise<ActionResult> {
  try {
    const encodedPublicId = Buffer.from(publicId, 'utf8').toString('base64url');

    const response = await fetch(`${API_URL}/upload/${encodedPublicId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    if (!response.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Delete failed' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}