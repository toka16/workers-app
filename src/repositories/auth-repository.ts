import type { AuthUser } from "@/domain/models";

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  /** Absolute URL the confirmation e-mail should send the user back to. */
  emailRedirectTo: string;
}

export interface AuthRepository {
  getCurrentUser(): Promise<AuthUser | null>;
  /** Returns whether the account still needs e-mail confirmation before signing in. */
  signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string, redirectTo: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  /** Completes e-mail confirmation / recovery / OAuth flows that redirect back with a code. */
  exchangeCodeForSession(code: string): Promise<void>;
  /** Permanently deletes the signed-in account and everything it owns in the database. */
  deleteAccount(): Promise<void>;
}
