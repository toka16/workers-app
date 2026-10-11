"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ChipOption {
  id: number;
  label: string;
  icon?: ReactNode;
}

/** Multi-select as tappable chips: quick on phones and shows the whole set at a glance. */
export function ChipPicker({
  options,
  value,
  onChange,
  max,
  invalid,
}: {
  options: ChipOption[];
  value: number[];
  onChange: (value: number[]) => void;
  max?: number;
  invalid?: boolean;
}) {
  const toggle = (id: number) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (!max || value.length < max) onChange([...value, id]);
  };
  return (
    <div className={cn("flex flex-wrap gap-2", invalid && "rounded-xl ring-2 ring-destructive/30 ring-offset-4")}>
      {options.map((o) => {
        const selected = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(o.id)}
            disabled={!selected && !!max && value.length >= max}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-all disabled:opacity-40",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-input bg-surface text-foreground hover:border-primary/50 hover:bg-primary-soft/50",
            )}
          >
            {selected ? <Check className="size-4" /> : o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
