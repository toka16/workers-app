import { DomainError } from "@/domain/errors";
import type { AuthUser } from "@/domain/models";
import type { AuthRepository, SignUpInput } from "@/repositories";
import type { TypedSupabaseClient } from "./types";
import { toDomainError } from "./errors";

export class SupabaseAuthRepository implements AuthRepository {
  /**
   * @param isolatedClient Session-less client factory, used to check a password without replacing
   * the caller's session. Only needed on the server.
   */
  constructor(
    private readonly db: TypedSupabaseClient,
    private readonly isolatedClient?: () => TypedSupabaseClient,
  ) {}

  async getCurrentUser(): Promise<AuthUser | null> {
    // getClaims verifies the JWT signature (unlike getSession), so it is safe for authorization.
    const { data, error } = await this.db.auth.getClaims();
    if (error || !data?.claims?.sub) return null;
    return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? "" };
  }

  async signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await this.db.auth.signUp({
      email: input.email,
      password: input.password,
      options: { emailRedirectTo: input.emailRedirectTo, data: { full_name: input.fullName }, captchaToken: input.captchaToken },
    });
    if (error) throw toDomainError(error);
    // With confirmations on, an existing e-mail returns a user without identities (no enumeration leak).
    if (data.user && data.user.identities?.length === 0) throw new DomainError("user_exists");
    return { needsConfirmation: !data.session };
  }

  async signIn(email: string, password: string, captchaToken?: string): Promise<AuthUser> {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password, options: { captchaToken } });
    if (error) throw toDomainError(error);
    return { id: data.user.id, email: data.user.email ?? email };
  }

  async signOut(): Promise<void> {
    const { error } = await this.db.auth.signOut();
    if (error) throw toDomainError(error);
  }

  async resendConfirmation(email: string, redirectTo: string, captchaToken?: string): Promise<void> {
    const { error } = await this.db.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo, captchaToken },
    });
    if (error) throw toDomainError(error);
  }

  async requestPasswordReset(email: string, redirectTo: string, captchaToken?: string): Promise<void> {
    const { error } = await this.db.auth.resetPasswordForEmail(email, { redirectTo, captchaToken });
    if (error) throw toDomainError(error);
  }

  async isRecentEmailLinkSession(maxAgeSeconds: number): Promise<boolean> {
    const { data, error } = await this.db.auth.getClaims();
    if (error || !data?.claims) return false;
    const since = Date.now() / 1000 - maxAgeSeconds;
    // E-mail links show up as "otp" (or "recovery" in some flows); a password sign-in is "password".
    return (data.claims.amr ?? []).some(
      (m) => typeof m === "object" && (m.method === "otp" || m.method === "recovery") && m.timestamp >= since,
    );
  }

  async verifyPassword(password: string): Promise<boolean> {
    if (!this.isolatedClient) throw new Error("verifyPassword needs an isolated client");
    const user = await this.getCurrentUser();
    if (!user?.email) throw new DomainError("unauthorized");
    const probe = this.isolatedClient();
    const { error } = await probe.auth.signInWithPassword({ email: user.email, password });
    if (error) {
      if (error.code === "invalid_credentials") return false;
      throw toDomainError(error);
    }
    // Revoke the throwaway session right away.
    await probe.auth.signOut({ scope: "local" });
    return true;
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.db.auth.updateUser({ password });
    if (error) throw toDomainError(error);
  }

  async exchangeCodeForSession(code: string): Promise<void> {
    const { error } = await this.db.auth.exchangeCodeForSession(code);
    if (error) throw toDomainError(error);
  }

  async deleteAccount(): Promise<void> {
    const { error } = await this.db.rpc("delete_my_account");
    if (error) throw toDomainError(error);
    await this.db.auth.signOut({ scope: "local" });
  }
}
