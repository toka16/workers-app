import "server-only";
import { cache } from "react";
import type { DataRepositories, FileStorage, Repositories } from "@/repositories";
import { createMemoryServerProvider } from "./memory/provider";
import { pick, type ServerContext, type ServerProvider } from "./provider";
import { supabaseServerProvider } from "./supabase/provider.server";

/**
 * Composition root for server code. Register a provider here, then select it per capability
 * with NEXT_PUBLIC_{AUTH,DB,STORAGE}_PROVIDER. Nothing outside src/infrastructure knows which
 * vendor is behind the repositories.
 */
const providers: Record<string, ServerProvider> = {
  supabase: supabaseServerProvider,
  memory: createMemoryServerProvider(),
};

async function buildData(context: ServerContext): Promise<DataRepositories & { storage: FileStorage }> {
  const storage = await pick(providers, "storage", "createStorage")(context);
  const data = await pick(providers, "db", "createData")(context, storage.getPublicUrl.bind(storage));
  return { ...data, storage };
}

/** Repositories bound to the current visitor's session. Reads cookies, so use behind <Suspense>. */
export const getRepositories = cache(async (): Promise<Repositories> => {
  const [auth, data] = await Promise.all([pick(providers, "auth", "createAuth")(), buildData("request")]);
  return { auth, ...data };
});

/** Session-less repositories for public data; safe inside `"use cache"` scopes. */
export function getPublicRepositories(): Promise<DataRepositories & { storage: FileStorage }> {
  return buildData("public");
}

/** Used by proxy.ts to keep sessions fresh; returns the signed-in user id. */
export const refreshSession: NonNullable<ServerProvider["refreshSession"]> = (request, response) =>
  pick(providers, "auth", "refreshSession")(request, response);
