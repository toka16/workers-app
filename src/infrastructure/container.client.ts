"use client";

import type { AuthRepository, FileStorage } from "@/repositories";
import { createMemoryBrowserProvider } from "./memory/provider";
import { pick, type BrowserProvider } from "./provider";
import { supabaseBrowserProvider } from "./supabase/provider.browser";

const providers: Record<string, BrowserProvider> = {
  supabase: supabaseBrowserProvider,
  memory: createMemoryBrowserProvider(),
};

let instances: { auth?: AuthRepository; storage?: FileStorage } = {};

/** Browser-side repositories. Used for direct-to-storage uploads (no server round trip for file bytes). */
export function getBrowserRepositories() {
  return {
    get auth(): AuthRepository {
      return (instances.auth ??= pick(providers, "auth", "createAuth")());
    },
    get storage(): FileStorage {
      return (instances.storage ??= pick(providers, "storage", "createStorage")());
    },
  };
}

export function resetBrowserRepositories(): void {
  instances = {};
}
