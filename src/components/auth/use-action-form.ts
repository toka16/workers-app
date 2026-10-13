"use client";

import { unstable_rethrow } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "@/actions/result";

/**
 * Glue between react-hook-form and a Server Action result: field errors go to the fields,
 * everything else becomes a translated form-level message.
 */
export function useActionErrors<T extends FieldValues>(setError: UseFormSetError<T>) {
  const t = useTranslations("errors");
  const [formError, setFormError] = useState<string | null>(null);

  function handle<R>(result: ActionResult<R>): result is Extract<ActionResult<R>, { ok: true }> {
    setFormError(null);
    if (result.ok) return true;
    if (result.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        setError(field as Path<T>, { message });
      }
    }
    if (!result.fieldErrors || result.error !== "validation") setFormError(t(result.error));
    return false;
  }

  return { formError, setFormError, handle };
}

/**
 * Calls a Server Action without letting a dropped connection or a crashed request reject silently:
 * anything thrown becomes an `unknown` result, which callers already show like any other error.
 */
export async function safeAction<R>(call: () => Promise<ActionResult<R>>): Promise<ActionResult<R>> {
  try {
    return await call();
  } catch (error) {
    unstable_rethrow(error);
    console.error(error);
    return { ok: false, error: "unknown" };
  }
}
