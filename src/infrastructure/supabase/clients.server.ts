import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "./database.types";
import { AUTH_COOKIE_NAME, supabaseEnv } from "./env";
import type { TypedSupabaseClient } from "./types";

/** Per-request server client bound to the caller's session cookies. */
export async function createSupabaseRequestClient(): Promise<TypedSupabaseClient> {
  // Session validation compares token expiry with the clock (Date.now), which Next.js only
  // allows once the render is explicitly request-time.
  await connection();
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseEnv.serverUrl, supabaseEnv.publishableKey, {
    cookieOptions: { name: AUTH_COOKIE_NAME },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components can't write cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

/**
 * Session-less client for public data. It never touches cookies, so it can be used
 * inside `"use cache"` functions and at build time.
 */
export function createSupabasePublicClient(): TypedSupabaseClient {
  return createClient<Database>(supabaseEnv.serverUrl, supabaseEnv.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
