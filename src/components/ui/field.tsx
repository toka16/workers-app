"use client";

import { useTranslations } from "next-intl";
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

interface FieldProps {
  id: string;
  label: ReactNode;
  /** i18n key under "validation.*" (or raw text). */
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  /**
   * For controls that aren't a single labelable element (e.g. a set of chips): renders a labelled
   * `role="group"` instead of a `<label for>` that would point at nothing.
   */
  group?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ id, label, error, hint, optional, group, className, children }: FieldProps) {
  const t = useTranslations();
  const message = error ? (t.has(`validation.${error}`) ? t(`validation.${error}`) : error) : null;
  const describedBy = message ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const labelContent = (
    <>
      {label}
      {optional && <span className="text-xs font-normal text-muted-foreground">({t("common.optional")})</span>}
    </>
  );

  // Point the control at its error or hint so screen readers announce it along with the label.
  const control =
    !group && describedBy && isValidElement<{ "aria-describedby"?: string }>(children)
      ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
          "aria-describedby": [children.props["aria-describedby"], describedBy].filter(Boolean).join(" "),
        })
      : children;

  return (
    <div
      className={cn("grid content-start gap-2", className)}
      {...(group ? { role: "group", "aria-labelledby": `${id}-label`, "aria-describedby": describedBy } : {})}
    >
      {group ? (
        <span id={`${id}-label`} className="flex items-baseline gap-1.5 text-sm leading-none font-medium text-foreground">
          {labelContent}
        </span>
      ) : (
        <Label htmlFor={id} className="flex items-baseline gap-1.5">
          {labelContent}
        </Label>
      )}
      {control}
      {message ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
