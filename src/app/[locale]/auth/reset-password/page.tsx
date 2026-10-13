import { Link2Off } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { getRepositories } from "@/infrastructure/container.server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth"))("resetTitle"), robots: { index: false } };
}

/** Reached from the recovery e-mail: /api/auth/callback has already signed the user in. */
export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("resetTitle")}>
      {/* The session is request data, so the check streams in behind this boundary. */}
      <Suspense fallback={<FormSkeleton />}>
        <ResetPasswordGate />
      </Suspense>
    </AuthCard>
  );
}

/** Only a fresh session opened by the e-mail link may set a new password; say so up front, not on submit. */
async function ResetPasswordGate() {
  const { auth } = await getRepositories();
  const valid = (await auth.getCurrentUser()) !== null && (await auth.isRecentEmailLinkSession(60 * 60));
  if (valid) return <ResetPasswordForm />;

  const t = await getTranslations("auth");
  return (
    <div className="grid justify-items-center gap-4 rounded-2xl bg-muted p-8 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-surface text-muted-foreground">
        <Link2Off className="size-7" />
      </span>
      <h2 className="text-xl font-bold">{t("resetExpiredTitle")}</h2>
      <p className="text-muted-foreground">{t("resetExpiredText")}</p>
      <Button asChild>
        <Link href="/auth/forgot-password">{t("sendNewLink")}</Link>
      </Button>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-5">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
