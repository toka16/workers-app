import type { AuthUser } from "@/domain/models";

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  /** Absolute URL the confirmation e-mail should send the user back to. */
  emailRedirectTo: string;
  /** Bot-check token; required by the provider only when captcha protection is enabled. */
  captchaToken?: string;
}

export interface AuthRepository {
  getCurrentUser(): Promise<AuthUser | null>;
  /** Returns whether the account still needs e-mail confirmation before signing in. */
  signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }>;
  signIn(email: string, password: string, captchaToken?: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  /** Sends the sign-up confirmation e-mail again (no-op for unknown or confirmed addresses). */
  resendConfirmation(email: string, redirectTo: string, captchaToken?: string): Promise<void>;
  requestPasswordReset(email: string, redirectTo: string, captchaToken?: string): Promise<void>;
  /**
   * Whether the current session came from an e-mail link (password recovery / confirmation) within
   * the last `maxAgeSeconds`. Only such sessions may set a new password without the current one.
   */
  isRecentEmailLinkSession(maxAgeSeconds: number): Promise<boolean>;
  /** Checks the signed-in user's current password without touching their session. */
  verifyPassword(password: string): Promise<boolean>;
  updatePassword(password: string): Promise<void>;
  /** Completes e-mail confirmation / recovery / OAuth flows that redirect back with a code. */
  exchangeCodeForSession(code: string): Promise<void>;
  /** Permanently deletes the signed-in account and everything it owns in the database. */
  deleteAccount(): Promise<void>;
}
