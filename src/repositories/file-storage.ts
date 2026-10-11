import type { StorageBucket } from "@/domain/models";

export interface UploadOptions {
  contentType: string;
  /** Long cache lifetime is safe because every upload gets a unique path. */
  cacheControlSeconds?: number;
}

export interface FileStorage {
  upload(bucket: StorageBucket, path: string, file: Blob, options: UploadOptions): Promise<string>;
  remove(bucket: StorageBucket, paths: string[]): Promise<void>;
  /** Public URL for a stored path. Absolute URLs are returned unchanged (e.g. seeded demo data). */
  getPublicUrl(bucket: StorageBucket, path: string): string;
}

/** Resolves a stored path to a public URL; data providers receive it to stay storage-agnostic. */
export type UrlResolver = FileStorage["getPublicUrl"];
