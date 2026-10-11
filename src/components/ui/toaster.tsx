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
        },
      }}
    />
  );
}
