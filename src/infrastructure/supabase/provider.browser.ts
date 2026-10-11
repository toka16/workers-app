import type { BrowserProvider } from "../provider";
import { SupabaseAuthRepository } from "./auth-repository";
import { getSupabaseBrowserClient } from "./clients.browser";
import { SupabaseFileStorage } from "./file-storage";

export const supabaseBrowserProvider: BrowserProvider = {
  createAuth: () => new SupabaseAuthRepository(getSupabaseBrowserClient()),
  createStorage: () => new SupabaseFileStorage(getSupabaseBrowserClient()),
};
