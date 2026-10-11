import { UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function WorkerNotFound() {
  const t = useTranslations();
  return (
    <div className="container-page grid justify-items-center gap-4 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
        <UserX className="size-8" />
      </span>
      <h1 className="text-2xl font-bold">{t("profile.notFoundTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("profile.notFoundText")}</p>
      <Button asChild>
        <Link href="/workers">{t("common.findWorker")}</Link>
      </Button>
    </div>
  );
}
