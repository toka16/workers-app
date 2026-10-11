"use client";

import { Camera, LoaderCircle, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { setAvatarAction } from "@/actions/dashboard";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { getBrowserRepositories } from "@/infrastructure/container.client";
import { ACCEPTED_IMAGE_TYPES, MAX_SOURCE_BYTES, processImage } from "@/lib/image";

export function AvatarUploader({ userId, name, url }: { userId: string; name: string; url: string | null }) {
  const t = useTranslations();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function upload(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return toast.error(t("validation.file_type"));
    if (file.size > MAX_SOURCE_BYTES) return toast.error(t("validation.file_too_large"));
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
      toast.success(t("dashboard.profile.savedToast"));
      router.refresh();
    } catch {
      setPreview(null);
      toast.error(t("errors.upload_failed"));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    const result = await setAvatarAction(null);
    setBusy(false);
    if (!result.ok) return toast.error(t(`errors.${result.error}`));
    setPreview(null);
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
            <Button type="button" variant="ghost" disabled={busy} onClick={remove} className="text-destructive">
              <Trash /> {t("dashboard.profile.removeAvatar")}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t("dashboard.profile.avatarHint")}</p>
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
