import { createBrowserClient } from "@supabase/ssr";
import type { TypedSupabaseClient } from "./types";
import type { Database } from "./database.types";
import { AUTH_COOKIE_NAME, supabaseEnv } from "./env";

let browserClient: TypedSupabaseClient | undefined;

/** Browser client; the session lives in cookies shared with the server. */
export function getSupabaseBrowserClient(): TypedSupabaseClient {
  browserClient ??= createBrowserClient<Database>(supabaseEnv.publicUrl, supabaseEnv.publishableKey, {
    cookieOptions: { name: AUTH_COOKIE_NAME },
  });
  return browserClient;
}
