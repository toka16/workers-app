function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

/**
 * Two URLs because the app may run in a container while Supabase runs on the host:
 * browsers use the public URL, server code may use an internal one (e.g. host.docker.internal).
 * Public file URLs are always built from the public URL.
 */
export const supabaseEnv = {
  get publicUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get serverUrl() {
    return process.env.SUPABASE_INTERNAL_URL || this.publicUrl;
  },
  get publishableKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
};

/**
 * @supabase/ssr derives the cookie name from the URL host. The browser and the server may use
 * different hosts (see above), so pin the name to keep one shared session cookie.
 */
export const AUTH_COOKIE_NAME = "sb-workers-auth-token";
