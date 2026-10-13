"use client";

import { LayoutDashboard, RotateCcw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Keeps the dashboard header and sidebar around a failed page, with a retry and a way back. */
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations();
  useEffect(() => console.error(error), [error]);
  return (
    <div className="grid justify-items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-destructive-soft text-destructive">
        <TriangleAlert className="size-7" />
      </span>
      <h1 className="text-xl font-bold">{t("errors.pageTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("errors.pageText")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={retry}>
          <RotateCcw /> {t("errors.retry")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <LayoutDashboard /> {t("errors.backToDashboard")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
