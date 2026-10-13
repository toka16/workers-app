import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<ComponentProps<"input">, "type" | "onChange"> {
  onCheckedChange?: (checked: boolean) => void;
}

/** Native checkbox with switch semantics and styling. */
export function Switch({ className, onCheckedChange, ...props }: SwitchProps) {
  return (
    <input
      type="checkbox"
      role="switch"
      data-slot="switch"
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-input-border transition-colors",
        "before:absolute before:top-0.5 before:left-0.5 before:size-5 before:rounded-full before:bg-white before:shadow-soft before:transition-transform before:content-['']",
        "checked:bg-primary checked:before:translate-x-5 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
