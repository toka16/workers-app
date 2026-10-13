"use client";

import { Camera, LoaderCircle, Trash } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { setAvatarAction } from "@/actions/dashboard";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { safeAction } from "@/components/auth/use-action-form";
import { useRouter } from "@/i18n/navigation";
import { getBrowserRepositories } from "@/infrastructure/container.client";
import { ACCEPTED_IMAGE_TYPES, formatBytes, ImageTooLargeError, MAX_IMAGE_BYTES, MAX_SOURCE_BYTES, processImage } from "@/lib/image";
import { ConfirmDialog } from "./confirm-dialog";

export function AvatarUploader({ userId, name, url }: { userId: string; name: string; url: string | null }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function upload(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return toast.error(t("validation.file_type"));
    if (file.size > MAX_SOURCE_BYTES) {
      return toast.error(t("dashboard.upload.tooLarge", { name: file.name, max: formatBytes(MAX_SOURCE_BYTES, locale) }));
    }
    setBusy(true);
    try {
      const image = await processImage(file, 512, { square: true });
      setPreview(URL.createObjectURL(image.blob));
      // Bytes go straight from the browser to storage; the server only records the path.
      const path = await getBrowserRepositories().storage.upload(
        "avatars",
        `${userId}/avatar-${crypto.randomUUID()}.${image.extension}`,
        image.blob,
        { contentType: image.contentType },
      );
      const result = await setAvatarAction(path);
      if (!result.ok) throw new Error(result.error);
      if (file.size > MAX_IMAGE_BYTES) {
        toast.warning(
          t("dashboard.upload.reducedOne", {
            from: formatBytes(file.size, locale),
            to: formatBytes(image.blob.size, locale),
            max: formatBytes(MAX_IMAGE_BYTES, locale),
          }),
        );
      } else {
        toast.success(t("dashboard.profile.savedToast"));
      }
      router.refresh();
    } catch (error) {
      setPreview(null);
      toast.error(
        error instanceof ImageTooLargeError
          ? t("dashboard.upload.notReducible", { name: file.name, max: formatBytes(MAX_IMAGE_BYTES, locale) })
          : t("errors.upload_failed"),
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    const result = await safeAction(() => setAvatarAction(null));
    setBusy(false);
    if (!result.ok) return toast.error(t(`errors.${result.error}`));
    setPreview(null);
    toast.success(t("dashboard.profile.avatarRemovedToast"));
    router.refresh();
  }

  const shown = preview ?? url;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative">
        <Avatar name={name || "?"} src={shown} className="size-24 text-2xl" />
        {busy && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white">
            <LoaderCircle className="size-6 animate-spin" />
          </span>
        )}
      </div>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            <Camera /> {t("dashboard.profile.changeAvatar")}
          </Button>
          {shown && (
            <ConfirmDialog
              title={t("dashboard.profile.removeAvatarConfirm")}
              confirmLabel={t("dashboard.profile.removeAvatar")}
              onConfirm={remove}
              trigger={
                <Button type="button" variant="ghost" disabled={busy} className="text-destructive">
                  <Trash /> {t("dashboard.profile.removeAvatar")}
                </Button>
              }
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t("dashboard.profile.avatarHint")}</p>
        <p className="text-xs text-muted-foreground">{t("dashboard.upload.limitHint", { max: formatBytes(MAX_IMAGE_BYTES, locale) })}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
    </div>
  );
}
