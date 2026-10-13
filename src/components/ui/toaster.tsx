"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-border !bg-surface !text-foreground !shadow-lift !font-sans",
          description: "!text-muted-foreground",
          // Same neutral card for every toast; the icon colour tells success, warning and error apart.
          success: "[&_[data-icon]]:text-success",
          warning: "[&_[data-icon]]:text-warning",
          error: "[&_[data-icon]]:text-destructive",
        },
      }}
    />
  );
}
