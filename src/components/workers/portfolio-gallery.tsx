"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PortfolioImage } from "@/domain/models";

export function PortfolioGallery({ images, workerName }: { images: PortfolioImage[]; workerName: string }) {
  const t = useTranslations("dashboard.portfolio");
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const current = open ? images[index] : null;

  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`group relative overflow-hidden rounded-xl bg-muted ${i === 0 && images.length > 2 ? "col-span-2 row-span-2" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={i === 0 && images.length > 2 ? img.image.url : img.thumb.url}
              alt={img.caption || workerName}
              loading={i < 3 ? "eager" : "lazy"}
              decoding="async"
              className="aspect-[4/3] size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {img.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {img.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && setIndex(null)}>
        <DialogContent className="max-w-5xl overflow-hidden border-none bg-black p-0 text-white"
          closeClassName="z-10 bg-black/50 text-white hover:bg-black/70 hover:text-white"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{current?.caption || workerName}</DialogTitle>
          {current && (
            <figure className="grid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.image.url} alt={current.caption || workerName} className="max-h-[80dvh] w-full object-contain" />
              <figcaption className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-white/85">{current.caption}</span>
                <span className="shrink-0 text-white/60">
                  {index! + 1} / {images.length}
                </span>
              </figcaption>
            </figure>
          )}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t("moveLeft")}
                className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t("moveRight")}
                className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
