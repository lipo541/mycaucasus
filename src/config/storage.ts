export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  documents: 'pilot_documents',
} as const;

export type StorageBucketKey = keyof typeof STORAGE_BUCKETS;
export const getBucket = (key: StorageBucketKey) => STORAGE_BUCKETS[key];
