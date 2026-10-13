"use server";

import { emailSchema, forgotPasswordSchema, passwordSchema, signInSchema, signUpSchema } from "@/domain/schemas";
import { getRepositories } from "@/infrastructure/container.server";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { fail, invalid, ok, type ActionResult } from "./result";

/** Where the e-mail confirmation link lands; the flag shows a "confirmed" message there. */
const CONFIRMED_PATH = "/dashboard/profile?confirmed=1";

/** How long after opening a recovery link the user may set a new password. */
const RECOVERY_WINDOW_SECONDS = 60 * 60;

function localizedPath(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

/**
 * Link target for e-mails: our callback route exchanges the code, then forwards to `next`.
 * Always built from the configured site URL, never from request headers (which a client controls).
 */
function callbackUrl(locale: string, next: string): string {
  const url = new URL("/api/auth/callback", siteUrl());
  url.searchParams.set("next", localizedPath(locale, next));
  return url.toString();
}

/** Turnstile tokens are opaque strings; anything else is dropped and the provider rejects it if required. */
function captcha(token: unknown): string | undefined {
  return typeof token === "string" && token.length <= 4096 ? token : undefined;
}

export async function signInAction(input: unknown, captchaToken?: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { auth } = await getRepositories();
    await auth.signIn(parsed.data.email, parsed.data.password, captcha(captchaToken));
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function signUpAction(
  input: unknown,
  locale: string,
  captchaToken?: unknown,
): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { auth } = await getRepositories();
    const result = await auth.signUp({
      ...parsed.data,
      emailRedirectTo: callbackUrl(locale, CONFIRMED_PATH),
      captchaToken: captcha(captchaToken),
    });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function resendConfirmationAction(email: unknown, locale: string, captchaToken?: unknown): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { auth } = await getRepositories();
    await auth.resendConfirmation(parsed.data, callbackUrl(locale, CONFIRMED_PATH), captcha(captchaToken));
  } catch (error) {
    // Same as password reset: only rate limiting and a failed bot check are worth telling the visitor about.
    const result = fail(error);
    if (!result.ok && (result.error === "rate_limited" || result.error === "captcha_failed")) return result;
  }
  return ok();
}

export async function forgotPasswordAction(input: unknown, locale: string, captchaToken?: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { auth } = await getRepositories();
    await auth.requestPasswordReset(parsed.data.email, callbackUrl(locale, "/auth/reset-password"), captcha(captchaToken));
  } catch (error) {
    // Don't reveal whether the address exists; only surface rate limiting and a failed bot check.
    const result = fail(error);
    if (!result.ok && (result.error === "rate_limited" || result.error === "captcha_failed")) return result;
  }
  return ok();
}

export async function updatePasswordAction(password: unknown): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { auth } = await getRepositories();
    // Only the session opened by a recovery link may skip the current password (see changePasswordAction).
    if (!(await auth.getCurrentUser()) || !(await auth.isRecentEmailLinkSession(RECOVERY_WINDOW_SECONDS))) {
      return { ok: false, error: "unauthorized" };
    }
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
