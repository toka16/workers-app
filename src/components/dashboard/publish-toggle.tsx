"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { setPublishedAction } from "@/actions/dashboard";
import { safeAction } from "@/components/auth/use-action-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function PublishToggle({
  published,
  canPublish,
  size = "lg",
  className,
}: {
  published: boolean;
  canPublish: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setPublished = (value: boolean) =>
    startTransition(async () => {
      const result = await safeAction(() => setPublishedAction(value));
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      if (value) toast.success(t("dashboard.publishedToast"));
      // Hiding takes the page out of search at once, so make it easy to take back.
      else toast.success(t("dashboard.unpublishedToast"), { action: { label: t("common.undo"), onClick: () => setPublished(true) } });
      router.refresh();
    });

  return (
    <Button
      onClick={() => setPublished(!published)}
      disabled={pending || (!published && !canPublish)}
      variant={published ? "outline" : "accent"}
      size={size}
      className={className}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : published ? <EyeOff /> : <Eye />}
      {published ? t("dashboard.unpublish") : t("dashboard.publish")}
    </Button>
  );
}
