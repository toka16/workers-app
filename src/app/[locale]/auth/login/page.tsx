import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth"))("signIn"), robots: { index: false } };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard
      title={t("loginTitle")}
      subtitle={t("loginSubtitle")}
      footer={
        <>
          <p>
            {t("noAccount")}{" "}
            <Link href="/auth/register" className="font-semibold text-primary hover:underline">
              {t("createAccount")}
            </Link>
          </p>
          <p>
            {t("clientsNote")}{" "}
            <Link href="/workers" className="font-semibold text-primary hover:underline">
              {t("clientsLink")}
            </Link>
          </p>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
