"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** The worker's shareable page address with copy and open buttons. */
export function ProfileLink({ url, slug }: { url: string; slug: string }) {
  const t = useTranslations();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("profile.copied"));
    } catch {
      // Clipboard access can be denied (permissions, insecure context); the address is on screen to copy by hand.
      toast.error(t("profile.copyFailed"));
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface py-1 pr-1 pl-3.5">
      <span className="w-0 flex-1 truncate text-sm" title={url}>
        {url}
      </span>
      <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={t("dashboard.profile.copyLink")}>
        <Copy />
      </Button>
      <Button asChild variant="ghost" size="icon-sm" aria-label={t("common.viewProfile")}>
        <Link href={`/workers/${slug}`} target="_blank">
          <ExternalLink />
        </Link>
      </Button>
    </div>
  );
}
