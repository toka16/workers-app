"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { signOutAction } from "@/actions/auth";
import { safeAction } from "@/components/auth/use-action-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useEditorGuard } from "./profile-editor/editor-guard";

export function SignOutButton({ compact }: { compact?: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const guard = useEditorGuard();
  const [pending, startTransition] = useTransition();

  const signOut = () =>
    startTransition(async () => {
      const result = await safeAction(() => signOutAction());
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      router.replace("/");
      router.refresh();
    });

  return (
    <Button
      variant="ghost"
      size={compact ? "icon" : "md"}
      disabled={pending}
      aria-label={t("common.logout")}
      onClick={() => (guard ? guard.confirm(signOut) : signOut())}
    >
      <LogOut />
      {!compact && t("common.logout")}
    </Button>
  );
}
