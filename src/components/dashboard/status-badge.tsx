import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<typeof Badge>, "variant"> & { live: boolean };

/** The one "live / hidden" profile status look: header pill, editor banner, anywhere else it shows up. */
export function StatusBadge({ live, className, children, ...props }: Props) {
  return (
    <Badge
      variant={live ? "success" : "muted"}
      className={cn("gap-1.5 border font-semibold", live ? "border-success/30" : "border-border", className)}
      {...props}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", live ? "bg-success" : "bg-muted-foreground")} />
      {children}
    </Badge>
  );
}
