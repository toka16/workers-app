"use client";

import { ArrowRight, LayoutDashboard, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { LogoMark } from "./logo";
import { useCurrentUser } from "./use-current-user";

export function MobileMenu() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("nav.menu")}>
          <Menu className="size-6" />
        </Button>
      </DialogTrigger>
      <DialogContent side="right" className="gap-6 p-5" aria-describedby={undefined}>
        <DialogTitle className="flex items-center gap-2.5">
          <LogoMark className="size-8" />
          {t("common.brand")}
        </DialogTitle>
        <nav className="grid gap-1 text-lg font-semibold">
          <Link href="/workers" onClick={close} className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-muted">
            {t("nav.workers")} <ArrowRight className="size-5 text-muted-foreground" />
          </Link>
          <Link href="/#categories" onClick={close} className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-muted">
            {t("nav.categories")} <ArrowRight className="size-5 text-muted-foreground" />
          </Link>
          <Link href="/#how-it-works" onClick={close} className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-muted">
            {t("nav.howItWorks")} <ArrowRight className="size-5 text-muted-foreground" />
          </Link>
        </nav>
        <div className="mt-auto grid gap-3">
          <Button asChild variant="primary" size="lg" onClick={close}>
            <Link href="/workers">
              <Search /> {t("common.findWorker")}
            </Link>
          </Button>
          {user ? (
            <Button asChild variant="secondary" size="lg" onClick={close}>
              <Link href="/dashboard">
                <LayoutDashboard /> {t("common.dashboard")}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="accent" size="lg" onClick={close}>
                <Link href="/auth/register">{t("common.joinAsWorker")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" onClick={close}>
                <Link href="/auth/login">{t("common.login")}</Link>
              </Button>
            </>
          )}
          <LanguageSwitcher className="justify-self-center" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
