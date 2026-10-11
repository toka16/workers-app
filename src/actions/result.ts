import { z } from "zod";
import { DomainError, type ErrorCode } from "@/domain/errors";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; fieldErrors?: Record<string, string>; details?: string };

export function ok<T>(data: T): ActionResult<T>;
export function ok(): ActionResult<void>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

/** Field errors keyed by dotted path, with messages that are i18n keys under "validation.*". */
export function invalid(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "validation", fieldErrors };
}

/** Converts thrown errors into a serializable result; unexpected errors are logged, not leaked. */
export function fail(error: unknown): ActionResult<never> {
  if (error instanceof DomainError) return { ok: false, error: error.code, details: error.details };
  // Let Next.js control-flow errors (redirect, notFound) propagate.
  if (error && typeof error === "object" && "digest" in error) throw error;
  console.error(error);
  return { ok: false, error: "unknown" };
}
