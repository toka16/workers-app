"use client";

import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, Trash, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition, type DragEvent } from "react";
import { toast } from "sonner";
import {
  addPortfolioImageAction,
  deletePortfolioImageAction,
  reorderPortfolioAction,
  updateCaptionAction,
} from "@/actions/dashboard";
import { safeAction } from "@/components/auth/use-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MAX_PORTFOLIO_IMAGES, type PortfolioImage } from "@/domain/models";
import { useRouter } from "@/i18n/navigation";
import { getBrowserRepositories } from "@/infrastructure/container.client";
import { ACCEPTED_IMAGE_TYPES, formatBytes, ImageTooLargeError, MAX_IMAGE_BYTES, MAX_SOURCE_BYTES, processImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";

export function PortfolioManager({ userId, images }: { userId: string; images: PortfolioImage[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(images);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [, startTransition] = useTransition();

  // Leaving mid-upload would silently drop the rest of the batch.
  const uploading = progress !== null;
  useEffect(() => {
    if (!uploading) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  // Re-sync with fresh server data after router.refresh().
  const [source, setSource] = useState(images);
  if (source !== images) {
    setSource(images);
    setItems(images);
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const all = [...fileList];
    const typed = all.filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (typed.length < all.length) toast.error(t("validation.file_type"));
    // Too big to process reliably in the browser; everything below this is shrunk to MAX_IMAGE_BYTES.
    for (const f of typed.filter((f) => f.size > MAX_SOURCE_BYTES)) {
      toast.error(t("dashboard.upload.tooLarge", { name: f.name, max: formatBytes(MAX_SOURCE_BYTES, locale) }));
    }
    const files = typed.filter((f) => f.size <= MAX_SOURCE_BYTES);
    const room = MAX_PORTFOLIO_IMAGES - items.length;
    if (files.length > room) toast.error(t("dashboard.portfolio.limit", { max: MAX_PORTFOLIO_IMAGES }));
    const batch = files.slice(0, Math.max(0, room));
    if (!batch.length) return;

    const { storage } = getBrowserRepositories();
    const maxImage = formatBytes(MAX_IMAGE_BYTES, locale);
    let uploaded = 0;
    let reduced = 0;
    setProgress({ done: 0, total: batch.length });
    for (const file of batch) {
      try {
        // Full image + thumbnail, both resized in the browser, uploaded straight to storage.
        const [full, thumb] = await Promise.all([processImage(file, 1600), processImage(file, 480)]);
        const id = crypto.randomUUID();
        const [path, thumbPath] = await Promise.all([
          storage.upload("portfolio", `${userId}/${id}.${full.extension}`, full.blob, { contentType: full.contentType }),
          storage.upload("portfolio", `${userId}/${id}-thumb.${thumb.extension}`, thumb.blob, { contentType: thumb.contentType }),
        ]);
        const result = await safeAction(() => addPortfolioImageAction({ path, thumbPath }));
        if (!result.ok) throw new Error(result.error);
        uploaded++;
        if (file.size > MAX_IMAGE_BYTES) reduced++;
      } catch (error) {
        toast.error(
          error instanceof ImageTooLargeError
            ? t("dashboard.upload.notReducible", { name: file.name, max: maxImage })
            : error instanceof Error && error.message === "limit_reached"
              ? t("dashboard.portfolio.limit", { max: MAX_PORTFOLIO_IMAGES })
              : `${t("errors.upload_failed")} (${file.name})`,
        );
      }
      setProgress((p) => p && { ...p, done: p.done + 1 });
    }
    setProgress(null);
    if (input.current) input.current.value = "";
    if (uploaded) {
      toast.success(t("dashboard.portfolio.uploadedToast", { count: uploaded }));
      router.refresh();
    }
    if (reduced) toast.warning(t("dashboard.upload.reducedMany", { count: reduced, max: maxImage }));
  }

  function move(index: number, delta: number) {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setItems(next);
    startTransition(async () => {
      const result = await safeAction(() => reorderPortfolioAction(next.map((i) => i.id)));
      if (!result.ok) {
        setItems(images);
        toast.error(t(`errors.${result.error}`));
      }
      router.refresh();
    });
  }

  async function remove(id: string) {
    const result = await safeAction(() => deletePortfolioImageAction(id));
    if (result.ok) {
      setItems((list) => list.filter((i) => i.id !== id));
      toast.success(t("dashboard.portfolio.deletedToast"));
      router.refresh();
    } else toast.error(t(`errors.${result.error}`));
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="grid gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "grid justify-items-center gap-3 rounded-2xl border-2 border-dashed bg-surface px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary-soft/50" : "border-border",
        )}
      >
        {progress ? (
          <div className="grid w-full max-w-sm gap-3">
            <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />
            <p className="font-medium" aria-live="polite">
              {t("dashboard.portfolio.uploading", { done: progress.done, total: progress.total })}
            </p>
            <Progress value={(progress.done / progress.total) * 100} />
          </div>
        ) : (
          <>
            <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
              <ImagePlus className="size-7" />
            </span>
            <div className="grid max-w-sm gap-1 text-sm text-muted-foreground">
              <p>{t("dashboard.portfolio.dropHint")}</p>
              <p>{t("dashboard.upload.limitHint", { max: formatBytes(MAX_IMAGE_BYTES, locale) })}</p>
            </div>
            <Button variant="accent" onClick={() => input.current?.click()} disabled={items.length >= MAX_PORTFOLIO_IMAGES}>
              <Upload /> {t("dashboard.portfolio.upload")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {items.length} / {MAX_PORTFOLIO_IMAGES}
            </p>
          </>
        )}
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("dashboard.portfolio.empty")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb.url} alt={img.caption} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                <Badge variant="overlay" className="absolute top-2 left-2">
                  {i + 1}
                </Badge>
              </div>
              <div className="grid gap-2 p-3">
                <CaptionInput image={img} />
                {/* Compact with a mouse, full 44px targets on touch screens. */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label={t("dashboard.portfolio.moveLeft")}
                    className="pointer-coarse:size-11"
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={i === items.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={t("dashboard.portfolio.moveRight")}
                    className="pointer-coarse:size-11"
                  >
                    <ArrowRight />
                  </Button>
                  <ConfirmDialog
                    title={t("dashboard.portfolio.deleteConfirm")}
                    onConfirm={() => remove(img.id)}
                    trigger={
                      <Button variant="ghost" size="icon-sm" className="ml-auto text-destructive pointer-coarse:size-11" aria-label={t("common.delete")}>
                        <Trash />
                      </Button>
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Saves on blur so editing captions feels like a document, not a form. */
function CaptionInput({ image }: { image: PortfolioImage }) {
  const t = useTranslations();
  const [value, setValue] = useState(image.caption);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (value.trim() === image.caption) return;
    setSaving(true);
    const result = await safeAction(() => updateCaptionAction(image.id, value));
    setSaving(false);
    if (result.ok) toast.success(t("common.saved"));
    else toast.error(t(`errors.${result.error}`));
  }

  return (
    <div className="relative">
      <Input
        value={value}
        maxLength={200}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        placeholder={t("dashboard.portfolio.captionPlaceholder")}
        aria-label={t("dashboard.portfolio.caption")}
        className="h-10 pr-9"
      />
      {saving && <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
    </div>
  );
}
