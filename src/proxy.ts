import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/infrastructure/container.server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createIntlMiddleware(routing);

const PROTECTED = /^\/dashboard(\/|$)/;
const GUEST_ONLY = /^\/auth\/(login|register)(\/|$)/;

function stripLocale(pathname: string): { locale: string; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(first)) {
    return { locale: first, path: `/${rest.join("/")}` };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

function localized(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

/** Copies refreshed auth cookies onto a redirect so the session survives it. */
function redirectWithCookies(url: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  if (response.headers.has("location")) return response;

  const userId = await refreshSession(request, response);
  const { locale, path } = stripLocale(request.nextUrl.pathname);

  // Optimistic checks only: every Server Action and data read re-verifies the user (and RLS has the final say).
  if (PROTECTED.test(path) && !userId) {
    const url = new URL(localized(locale, "/auth/login"), request.url);
    url.searchParams.set("next", path + request.nextUrl.search);
    return redirectWithCookies(url, response);
  }
  if (GUEST_ONLY.test(path) && userId) {
    return redirectWithCookies(new URL(localized(locale, "/dashboard"), request.url), response);
  }
  return response;
}

export const config = {
  // Everything except API routes, Next internals and files with an extension (sitemap.xml, images…).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
