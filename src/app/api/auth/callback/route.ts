import { NextResponse, type NextRequest } from "next/server";
import { getRepositories } from "@/infrastructure/container.server";
import { safeNext } from "@/lib/safe-redirect";
import { siteUrl } from "@/lib/site";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Same origin the e-mail link was built from. The request's own origin can be an internal address
  // (e.g. 0.0.0.0 in a container), where the session cookie just set would not be sent.
  const origin = siteUrl();
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    try {
      const { auth } = await getRepositories();
      await auth.exchangeCodeForSession(code);
      return NextResponse.redirect(new URL(next, origin));
    } catch {
      // fall through to the error redirect
    }
  }
  const locale = next.startsWith("/en/") || next === "/en" ? "/en" : "";
  return NextResponse.redirect(new URL(`${locale}/auth/login?error=link`, origin));
}
