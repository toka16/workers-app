"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function SignOutButton({ compact }: { compact?: boolean }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size={compact ? "icon" : "md"}
      disabled={pending}
      aria-label={t("logout")}
      onClick={() =>
        startTransition(async () => {
          await signOutAction();
          router.replace("/");
          router.refresh();
        })
      }
    >
      <LogOut />
      {!compact && t("logout")}
    </Button>
  );
}
