import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: PageProps<"/[locale]/auth/register">): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: (await getTranslations("auth"))("registerTitle"),
    alternates: {
      canonical: locale === "ka" ? "/auth/register" : "/en/auth/register",
      languages: { ka: "/auth/register", en: "/en/auth/register" },
    },
  };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard
      title={t("registerTitle")}
      subtitle={t("registerSubtitle")}
      footer={
        <>
          <p>
            {t("haveAccount")}{" "}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              {t("signIn")}
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
      <RegisterForm />
    </AuthCard>
  );
}
