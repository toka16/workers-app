export const ERROR_CODES = [
  "unknown",
  "not_found",
  "unauthorized",
  "validation",
  "conflict",
  "profile_incomplete",
  "invalid_credentials",
  "email_not_confirmed",
  "user_exists",
  "weak_password",
  "rate_limited",
  "upload_failed",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Provider-agnostic error. Repositories translate vendor errors into these codes. */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details?: string,
  ) {
    super(message ?? code);
    this.name = "DomainError";
  }
}

export function toErrorCode(error: unknown): ErrorCode {
  return error instanceof DomainError ? error.code : "unknown";
}
