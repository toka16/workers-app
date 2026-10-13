const BASE = "http://internal.invalid";

/**
 * Returns `value` only when it resolves to a same-origin path, else `fallback`. Parsing (instead of
 * prefix checks) also rejects "/\evil.com" and "/\t/evil.com", which browsers treat as "//evil.com".
 */
export function safeNext(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/")) return fallback;
  try {
    const url = new URL(value, BASE);
    return url.origin === BASE ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
