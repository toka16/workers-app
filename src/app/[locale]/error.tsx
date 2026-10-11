"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-page grid flex-1 content-center justify-items-center gap-4 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-destructive-soft text-destructive">
        <TriangleAlert className="size-8" />
      </span>
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("pageText")}</p>
      <Button onClick={reset}>
        <RotateCcw /> {t("retry")}
      </Button>
    </div>
  );
}
