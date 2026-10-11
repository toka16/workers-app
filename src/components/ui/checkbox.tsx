import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Native checkbox (form-friendly, no hydration quirks) styled by the `checkbox` utility in globals.css. */
export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return <input type="checkbox" data-slot="checkbox" className={cn("checkbox", className)} {...props} />;
}
