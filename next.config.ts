import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
// Only the demo seed points images at these hosts (see isDemoImageUrl in src/domain/models.ts).
const demoImageHosts = "https://picsum.photos https://fastly.picsum.photos https://i.pravatar.cc";
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
// Cloudflare Turnstile (src/components/auth/captcha.tsx), only when a site key is configured.
const turnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? " https://challenges.cloudflare.com" : "";

// No nonces: they would force every page to render per request. 'unsafe-inline' scripts are needed
// for Next's inline bootstrap; the policy still pins where images, data and frames may come from.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${supabaseOrigin} ${demoImageHosts}`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin}${isDev ? " ws: wss:" : ""}`,
  `frame-src 'self'${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isHttps ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Self-contained server bundle for the Docker image; Vercel ignores this.
  output: "standalone",
  images: {
    // Images are resized in the browser before upload, so we skip the optimizer
    // (keeps us inside the Vercel Hobby image-optimization quota).
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
