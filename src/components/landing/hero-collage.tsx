"use client";

import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";

export interface CollageWorker {
  slug: string;
  name: string;
  headline: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  city: string;
  price: string | null;
}

const positions = [
  "top-0 left-6 w-64 rotate-[-4deg]",
  "top-28 right-0 w-60 rotate-[3deg]",
  "bottom-0 left-16 w-56 rotate-[-1deg]",
];

/** Decorative stack of real worker cards floating next to the hero text (desktop only). */
export function HeroCollage({ workers }: { workers: CollageWorker[] }) {
  const reduce = useReducedMotion();
  const t = useTranslations("profile");
  return (
    <div className="relative hidden h-[30rem] lg:block" aria-hidden>
      <div className="absolute inset-10 rounded-full bg-accent/25 blur-3xl" />
      {workers.slice(0, 3).map((w, i) => (
        <motion.div
          key={w.slug}
          className={`absolute ${positions[i]}`}
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={reduce ? undefined : { opacity: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.2 + i * 0.15 },
            y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 },
          }}
        >
          <div className="overflow-hidden rounded-2xl bg-surface shadow-lift ring-1 ring-black/5">
            {w.coverUrl && i !== 2 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={w.coverUrl} alt="" className="h-28 w-full object-cover" />
            )}
            <div className="flex items-center gap-3 p-3.5">
              <Avatar name={w.name} src={w.avatarUrl} className="size-11 text-sm" />
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate text-sm font-bold text-foreground">
                  {w.name} <BadgeCheck className="size-4 shrink-0 text-primary" />
                </p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {w.city}
                </p>
              </div>
            </div>
            {i === 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-3.5 py-2.5 text-xs">
                <span className="truncate text-muted-foreground">{w.headline}</span>
                {w.price && <span className="shrink-0 font-bold text-foreground">{w.price}</span>}
              </div>
            )}
            {i === 2 && (
              <div className="flex items-center gap-2 bg-success-soft px-3.5 py-2.5 text-xs font-semibold text-success">
                <Phone className="size-3.5" /> {t("call")}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
