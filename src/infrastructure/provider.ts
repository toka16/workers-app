import type { NextRequest, NextResponse } from "next/server";
import type { AuthRepository, DataRepositories, FileStorage, UrlResolver } from "@/repositories";

/**
 * "request": bound to the visitor's session (Server Components, Server Actions, Route Handlers).
 * "public":  no session at all; safe inside `"use cache"` and at build time.
 */
export type ServerContext = "request" | "public";

/** A provider implements any subset of the capabilities; the container picks one per capability. */
export interface ServerProvider {
  createAuth?(): Promise<AuthRepository>;
  createStorage?(context: ServerContext): Promise<FileStorage>;
  createData?(context: ServerContext, resolveUrl: UrlResolver): Promise<DataRepositories>;
  /** Refreshes the session in Proxy and returns the signed-in user id, if any. */
  refreshSession?(request: NextRequest, response: NextResponse): Promise<string | null>;
}

export interface BrowserProvider {
  createAuth?(): AuthRepository;
  createStorage?(): FileStorage;
}

export type Capability = "auth" | "db" | "storage";

/** Provider names per capability. NEXT_PUBLIC_ so server and browser agree; values are not secrets. */
export const providerConfig: Record<Capability, string> = {
  auth: process.env.NEXT_PUBLIC_AUTH_PROVIDER || "supabase",
  db: process.env.NEXT_PUBLIC_DB_PROVIDER || "supabase",
  storage: process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "supabase",
};

export function pick<P, K extends keyof P>(
  registry: Record<string, P>,
  capability: Capability,
  method: K,
): NonNullable<P[K]> {
  const name = providerConfig[capability];
  const provider = registry[name];
  const factory = provider?.[method];
  if (!factory) {
    throw new Error(`Provider "${name}" does not implement ${capability} (${String(method)}).`);
  }
  return (factory as (...args: unknown[]) => unknown).bind(provider) as NonNullable<P[K]>;
}
