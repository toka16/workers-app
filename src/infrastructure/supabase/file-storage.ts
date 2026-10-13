import { isDemoImageUrl, type StorageBucket } from "@/domain/models";
import { DomainError } from "@/domain/errors";
import type { FileStorage, UploadOptions } from "@/repositories";
import type { TypedSupabaseClient } from "./types";
import { toDomainError } from "./errors";
import { supabaseEnv } from "./env";

export class SupabaseFileStorage implements FileStorage {
  constructor(private readonly db: TypedSupabaseClient) {}

  async upload(bucket: StorageBucket, path: string, file: Blob, options: UploadOptions): Promise<string> {
    const { data, error } = await this.db.storage.from(bucket).upload(path, file, {
      contentType: options.contentType,
      cacheControl: String(options.cacheControlSeconds ?? 31_536_000),
      upsert: false,
    });
    if (error) throw new DomainError("upload_failed", error.message);
    return data.path;
  }

  async remove(bucket: StorageBucket, paths: string[]): Promise<void> {
    const own = paths.filter((p) => !isAbsoluteUrl(p));
    if (!own.length) return;
    const { error } = await this.db.storage.from(bucket).remove(own);
    if (error) throw toDomainError(error);
  }

  async list(bucket: StorageBucket, folder: string): Promise<string[]> {
    const { data, error } = await this.db.storage.from(bucket).list(folder, { limit: 1000 });
    if (error) throw toDomainError(error);
    // Folders come back with a null id; we only store flat files.
    return data.filter((f) => f.id !== null).map((f) => `${folder}/${f.name}`);
  }

  getPublicUrl(bucket: StorageBucket, path: string): string {
    return supabasePublicUrl(bucket, path);
  }
}

export function isAbsoluteUrl(path: string): boolean {
  return /^https?:\/\//.test(path);
}

/** Pure URL builder; always uses the browser-facing URL even when the server talks to an internal one. */
export function supabasePublicUrl(bucket: StorageBucket, path: string): string {
  // Absolute URLs only come from the demo seed; anything else would let a worker embed arbitrary hosts.
  if (isAbsoluteUrl(path)) return isDemoImageUrl(path) ? path : "";
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${supabaseEnv.publicUrl}/storage/v1/object/public/${bucket}/${encoded}`;
}
