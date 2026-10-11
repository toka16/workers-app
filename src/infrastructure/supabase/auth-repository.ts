import { DomainError } from "@/domain/errors";
import type { AuthUser } from "@/domain/models";
import type { AuthRepository, SignUpInput } from "@/repositories";
import type { TypedSupabaseClient } from "./types";
import { toDomainError } from "./errors";

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly db: TypedSupabaseClient) {}

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
      options: { emailRedirectTo: input.emailRedirectTo, data: { full_name: input.fullName } },
    });
    if (error) throw toDomainError(error);
    // With confirmations on, an existing e-mail returns a user without identities (no enumeration leak).
    if (data.user && data.user.identities?.length === 0) throw new DomainError("user_exists");
    return { needsConfirmation: !data.session };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) throw toDomainError(error);
    return { id: data.user.id, email: data.user.email ?? email };
  }

  async signOut(): Promise<void> {
    const { error } = await this.db.auth.signOut();
    if (error) throw toDomainError(error);
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.db.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw toDomainError(error);
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
