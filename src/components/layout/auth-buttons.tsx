"use client";

import { LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useCurrentUser } from "./use-current-user";

export function AuthButtons() {
  const t = useTranslations("common");
  const user = useCurrentUser();

  if (user === undefined) return <Skeleton className="h-11 w-40" />;

  if (user) {
    return (
      <Button asChild variant="secondary">
        <Link href="/dashboard">
          <LayoutDashboard />
          {t("dashboard")}
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost">
        <Link href="/auth/login">{t("login")}</Link>
      </Button>
      <Button asChild variant="accent">
        <Link href="/auth/register">{t("joinAsWorker")}</Link>
      </Button>
    </div>
  );
}
