"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAccountAction } from "@/actions/dashboard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

export function DeleteAccount() {
  const t = useTranslations();
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const word = t("dashboard.account.deleteConfirmWord");

  async function remove() {
    setBusy(true);
    const result = await deleteAccountAction();
    setBusy(false);
    if (!result.ok) return toast.error(t(`errors.${result.error}`));
    router.replace("/");
    router.refresh();
  }

  return (
    <Dialog onOpenChange={() => setConfirm("")}>
      <DialogTrigger asChild>
        <Button variant="destructive">{t("dashboard.account.deleteButton")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-destructive" /> {t("dashboard.account.deleteConfirmTitle")}
          </DialogTitle>
          <DialogDescription>{t("dashboard.account.deleteText")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-2">
          <label htmlFor="confirm-delete" className="text-sm font-medium">
            {t("dashboard.account.deleteConfirmText")}
          </label>
          <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </DialogBody>
        <DialogFooter>
          <Button variant="destructive" disabled={confirm !== word || busy} onClick={remove}>
            {busy && <LoaderCircle className="animate-spin" />}
            {t("dashboard.account.deleteButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
