import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="container-page grid justify-items-center gap-4 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
        <Compass className="size-8" />
      </span>
      <p className="font-display text-6xl font-extrabold text-primary/20">404</p>
      <h1 className="text-2xl font-bold">{t("errors.notFoundTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("errors.notFoundText")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">{t("errors.goHome")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/workers">{t("common.findWorker")}</Link>
        </Button>
      </div>
    </div>
  );
}
