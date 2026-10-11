import { DomainError, type ErrorCode } from "@/domain/errors";

interface SupabaseLikeError {
  message?: string;
  code?: string;
  status?: number;
  details?: string | null;
}

const AUTH_CODES: Record<string, ErrorCode> = {
  invalid_credentials: "invalid_credentials",
  email_not_confirmed: "email_not_confirmed",
  user_already_exists: "user_exists",
  email_exists: "user_exists",
  weak_password: "weak_password",
  over_email_send_rate_limit: "rate_limited",
  over_request_rate_limit: "rate_limited",
  session_not_found: "unauthorized",
  no_authorization: "unauthorized",
  bad_jwt: "unauthorized",
};

/** Maps PostgREST / GoTrue / Storage errors to provider-agnostic DomainErrors. */
export function toDomainError(error: SupabaseLikeError): DomainError {
  const message = error.message ?? "Supabase error";
  if (error.code && AUTH_CODES[error.code]) return new DomainError(AUTH_CODES[error.code], message);
  if (message.startsWith("profile_incomplete")) {
    return new DomainError("profile_incomplete", message, message.split(":")[1]?.trim());
  }
  switch (error.code) {
    case "23505":
      return new DomainError("conflict", message, error.details ?? undefined);
    case "23514":
    case "22001":
    case "22P02":
      return new DomainError("validation", message);
    case "42501":
    case "PGRST301":
      return new DomainError("unauthorized", message);
    case "PGRST116":
      return new DomainError("not_found", message);
  }
  if (error.status === 401 || error.status === 403) return new DomainError("unauthorized", message);
  if (error.status === 429) return new DomainError("rate_limited", message);
  return new DomainError("unknown", message);
}

type Result<T> = { data: T; error: SupabaseLikeError | null };

/** Unwraps a query that must return data. */
export function check<T>(result: Result<T>): NonNullable<T> {
  if (result.error) throw toDomainError(result.error);
  if (result.data == null) throw new DomainError("not_found");
  return result.data;
}

/** Unwraps a query whose data may legitimately be empty (maybeSingle). */
export function checkMaybe<T>(result: Result<T>): T | null {
  if (result.error) throw toDomainError(result.error);
  return result.data ?? null;
}

/** For writes that don't return rows. */
export function checkOk(result: { error: SupabaseLikeError | null }): void {
  if (result.error) throw toDomainError(result.error);
}
