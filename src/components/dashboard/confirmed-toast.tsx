"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * The e-mail confirmation link lands on the dashboard with `?confirmed=1`: say so once, then drop the
 * flag so a reload or a shared URL doesn't repeat it. Reads the URL in an effect, so no Suspense needed.
 */
export function ConfirmedToast() {
  const t = useTranslations("auth");
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("confirmed") !== "1") return;
    // A fixed id keeps a double-run effect (Strict Mode) from showing it twice.
    toast.success(t("confirmedTitle"), { id: "email-confirmed" });
    url.searchParams.delete("confirmed");
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }, [router, t]);

  return null;
}
