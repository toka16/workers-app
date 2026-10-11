import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cache } from "react";
import type { ServerContext, ServerProvider } from "../provider";
import { SupabaseAuthRepository } from "./auth-repository";
import { createSupabasePublicClient, createSupabaseRequestClient } from "./clients.server";
import type { Database } from "./database.types";
import { AUTH_COOKIE_NAME, supabaseEnv } from "./env";
import { SupabaseFileStorage } from "./file-storage";
import { SupabasePortfolioRepository } from "./portfolio-repository";
import { SupabaseReferenceRepository } from "./reference-repository";
import { SupabaseServiceRepository } from "./service-repository";
import type { TypedSupabaseClient } from "./types";
import { SupabaseWorkerRepository } from "./worker-repository";

// One client per request so auth, data and storage share the same session.
const requestClient = cache(createSupabaseRequestClient);

const client = (context: ServerContext): Promise<TypedSupabaseClient> | TypedSupabaseClient =>
  context === "request" ? requestClient() : createSupabasePublicClient();

export const supabaseServerProvider: ServerProvider = {
  async createAuth() {
    return new SupabaseAuthRepository(await requestClient());
  },

  async createStorage(context) {
    return new SupabaseFileStorage(await client(context));
  },

  async createData(context, resolveUrl) {
    const db = await client(context);
    return {
      workers: new SupabaseWorkerRepository(db, resolveUrl),
      services: new SupabaseServiceRepository(db),
      portfolio: new SupabasePortfolioRepository(db, resolveUrl),
      reference: new SupabaseReferenceRepository(db),
    };
  },

  async refreshSession(request, response) {
    // No auth cookie means no session: skip the work (and the network call) for anonymous visitors.
    if (!request.cookies.getAll().some((c) => c.name.startsWith(AUTH_COOKIE_NAME))) return null;
    const supabase = createServerClient<Database>(supabaseEnv.serverUrl, supabaseEnv.publishableKey, {
      cookieOptions: { name: AUTH_COOKIE_NAME },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    });
    // getClaims validates the JWT and refreshes an expired session (writing new cookies above).
    const { data } = await supabase.auth.getClaims();
    return data?.claims?.sub ?? null;
  },
};
