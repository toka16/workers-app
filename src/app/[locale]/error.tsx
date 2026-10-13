"use client";

import { House, RotateCcw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-page grid flex-1 content-center justify-items-center gap-4 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-destructive-soft text-destructive">
        <TriangleAlert className="size-8" />
      </span>
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("pageText")}</p>
      {/* Retrying won't help with a persistent error, so there's always a way out too. */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={retry}>
          <RotateCcw /> {t("retry")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <House /> {t("goHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
