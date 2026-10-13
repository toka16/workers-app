import type { StorageBucket } from "@/domain/models";

export interface UploadOptions {
  contentType: string;
  /** Long cache lifetime is safe because every upload gets a unique path. */
  cacheControlSeconds?: number;
}

export interface FileStorage {
  upload(bucket: StorageBucket, path: string, file: Blob, options: UploadOptions): Promise<string>;
  remove(bucket: StorageBucket, paths: string[]): Promise<void>;
  /** Paths of every file directly inside `folder` (e.g. a user's own folder). */
  list(bucket: StorageBucket, folder: string): Promise<string[]>;
  /** Public URL for a stored path. Absolute URLs are only kept for the seeded demo image hosts. */
  getPublicUrl(bucket: StorageBucket, path: string): string;
}

/** Resolves a stored path to a public URL; data providers receive it to stay storage-agnostic. */
export type UrlResolver = FileStorage["getPublicUrl"];
