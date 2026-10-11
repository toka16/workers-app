"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { setPublishedAction } from "@/actions/dashboard";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function PublishToggle({ published, canPublish }: { published: boolean; canPublish: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      const result = await setPublishedAction(!published);
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(published ? t("dashboard.unpublishedToast") : t("dashboard.publishedToast"));
      router.refresh();
    });

  return (
    <Button
      onClick={toggle}
      disabled={pending || (!published && !canPublish)}
      variant={published ? "outline" : "accent"}
      size="lg"
    >
      {pending ? <LoaderCircle className="animate-spin" /> : published ? <EyeOff /> : <Eye />}
      {published ? t("dashboard.unpublish") : t("dashboard.publish")}
    </Button>
  );
}
