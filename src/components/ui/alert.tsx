import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  error: { icon: CircleAlert, className: "bg-destructive-soft text-destructive" },
  success: { icon: CircleCheck, className: "bg-success-soft text-success-strong" },
  info: { icon: Info, className: "bg-primary-soft text-primary-soft-foreground" },
};

export function Alert({ variant = "info", children, className }: { variant?: keyof typeof VARIANTS; children: ReactNode; className?: string }) {
  const { icon: Icon, className: style } = VARIANTS[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium", style, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
