"use server";

import { headers } from "next/headers";
import { forgotPasswordSchema, passwordSchema, signInSchema, signUpSchema } from "@/domain/schemas";
import { getRepositories } from "@/infrastructure/container.server";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { fail, invalid, ok, type ActionResult } from "./result";

async function origin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? siteUrl();
}

function localizedPath(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

/** Link target for e-mails: our callback route exchanges the code, then forwards to `next`. */
async function callbackUrl(locale: string, next: string): Promise<string> {
  const url = new URL("/api/auth/callback", await origin());
  url.searchParams.set("next", localizedPath(locale, next));
  return url.toString();
}

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { auth } = await getRepositories();
    await auth.signIn(parsed.data.email, parsed.data.password);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function signUpAction(input: unknown, locale: string): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { auth } = await getRepositories();
    const result = await auth.signUp({
      ...parsed.data,
      emailRedirectTo: await callbackUrl(locale, "/dashboard/profile"),
    });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function forgotPasswordAction(input: unknown, locale: string): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { auth } = await getRepositories();
    await auth.requestPasswordReset(parsed.data.email, await callbackUrl(locale, "/auth/reset-password"));
  } catch (error) {
    // Don't reveal whether the address exists; only surface rate limiting.
    const result = fail(error);
    if (!result.ok && result.error === "rate_limited") return result;
  }
  return ok();
}

export async function updatePasswordAction(password: unknown): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { auth } = await getRepositories();
    if (!(await auth.getCurrentUser())) return { ok: false, error: "unauthorized" };
    await auth.updatePassword(parsed.data);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function signOutAction(): Promise<ActionResult> {
  try {
    const { auth } = await getRepositories();
    await auth.signOut();
    return ok();
  } catch (error) {
    return fail(error);
  }
}
