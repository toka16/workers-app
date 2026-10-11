import { NextResponse, type NextRequest } from "next/server";
import { getRepositories } from "@/infrastructure/container.server";

/** Only allow same-site relative redirects (prevents open redirects via `next`). */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
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
