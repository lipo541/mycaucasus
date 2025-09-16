import { createSupabaseBrowserClient } from './supabaseClient';
import { getBucket } from '@/config/storage';

export type UploadResult = { path: string };

export async function uploadAvatar(userId: string, file: File): Promise<UploadResult> {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket('avatars');
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  return { path };
}

export async function uploadDocuments(userId: string, files: File[]): Promise<UploadResult[]> {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket('documents');
  const results: UploadResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/docs/${Date.now()}_${i}_${safe}`;
    const { error } = await supabase.storage.from(bucket).upload(path, f, { upsert: true, cacheControl: '3600' });
    if (error) throw error;
    results.push({ path });
  }
  return results;
}

export async function getSignedDocumentUrl(path: string, expiresInSeconds = 60 * 60) {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket('documents');
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function getSignedAvatarUrl(path: string, expiresInSeconds = 60 * 60) {
  const supabase = createSupabaseBrowserClient();
  const bucket = getBucket('avatars');
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
