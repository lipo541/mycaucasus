import { getBucket, type StorageBucketKey } from "@/config/storage";
import { createSupabaseBrowserClient } from "./supabaseClient";

export type UploadResult = { path: string };

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<UploadResult> {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket("avatars");
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  return { path };
}

export async function uploadDocuments(
  userId: string,
  files: File[]
): Promise<UploadResult[]> {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket("documents");
  const results: UploadResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/docs/${Date.now()}_${i}_${safe}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, f, { upsert: true, cacheControl: "3600" });
    if (error) throw error;
    results.push({ path });
  }
  return results;
}

export async function getSignedDocumentUrl(
  path: string,
  expiresInSeconds = 60 * 60
) {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket("documents");
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function getSignedAvatarUrl(
  path: string,
  expiresInSeconds = 60 * 60
) {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket("avatars");
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

// Remove multiple paths from a bucket (best-effort)
export async function removeStoragePaths(
  bucketKey: StorageBucketKey,
  paths: string[]
): Promise<void> {
  if (!paths || paths.length === 0) return;
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket(bucketKey);
  await supabase.storage.from(bucket).remove(paths);
}

// ============================================================
// LOCATION IMAGE UPLOAD FUNCTIONS
// ============================================================

export const LOCATIONS_BUCKET = "locations";

/**
 * Upload image to Supabase Storage for locations
 *
 * @param file - Image file to upload
 * @param locationId - Location identifier (e.g., 'gudauri')
 * @param folder - Subfolder: 'hero' | 'gallery' | 'thumbnails'
 * @returns Public URL and storage path
 */
export async function uploadLocationImage(
  file: File,
  locationId: string,
  folder: "hero" | "gallery" | "thumbnails" = "gallery"
): Promise<{ url: string; path: string; error?: string }> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return {
        url: "",
        path: "",
        error: "Invalid file type. Use JPG, PNG, or WebP",
      };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        url: "",
        path: "",
        error: "File too large. Maximum 5MB allowed",
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomStr}.${extension}`;

    // Upload path: locations/{locationId}/{folder}/{fileName}
    const filePath = `${locationId}/${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(LOCATIONS_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return { url: "", path: "", error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(LOCATIONS_BUCKET).getPublicUrl(data.path);

    return { url: publicUrl, path: data.path, error: undefined };
  } catch (error) {
    console.error("Upload error:", error);
    return { url: "", path: "", error: "Upload failed" };
  }
}

/**
 * Upload multiple images (batch upload for gallery)
 *
 * @param files - Array of image files
 * @param locationId - Location identifier
 * @param folder - Subfolder
 * @returns Array of uploaded URLs with metadata
 */
export async function uploadMultipleLocationImages(
  files: File[],
  locationId: string,
  folder: "hero" | "gallery" | "thumbnails" = "gallery"
): Promise<
  Array<{ url: string; path: string; fileName: string; error?: string }>
> {
  const results = [];

  for (const file of files) {
    const result = await uploadLocationImage(file, locationId, folder);
    results.push({
      ...result,
      fileName: file.name,
    });
  }

  return results;
}

/**
 * Delete location image from Supabase Storage
 *
 * @param path - Storage path (e.g., 'gudauri/gallery/123.jpg')
 */
export async function deleteLocationImage(
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.storage
      .from(LOCATIONS_BUCKET)
      .remove([path]);

    if (error) {
      console.error("Storage delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: "Delete failed" };
  }
}

// Remove multiple paths from a bucket (original function restored)
async function removePathsInternal(
  bucketKey: StorageBucketKey,
  paths: string[]
): Promise<void> {
  if (!paths || paths.length === 0) return;
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket(bucketKey);

  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.warn("Failed to remove storage paths", { bucket, paths, error });
    }
  } catch (e) {
    console.warn("Exception removing storage paths", e);
  }
}
