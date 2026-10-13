"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { updatePasswordAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { resetPasswordSchema } from "@/domain/schemas";
import { useRouter } from "@/i18n/navigation";
import { PasswordInput } from "./password-input";
import { safeAction, useActionErrors } from "./use-action-form";

type Values = z.input<typeof resetPasswordSchema>;

export function ResetPasswordForm({ submitLabel, onDoneHref = "/dashboard" }: { submitLabel?: string; onDoneHref?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirm: "" } });
  const { formError, handle } = useActionErrors(form.setError);
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    if (handle(await safeAction(() => updatePasswordAction(values.password)))) {
      toast.success(t("dashboard.account.passwordChangedToast"));
      form.reset();
      router.replace(onDoneHref);
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}
      <Field id="password" label={t("auth.newPassword")} error={errors.password?.message} hint={t("auth.passwordHint")}>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Field id="confirm" label={t("auth.confirmPassword")} error={errors.confirm?.message}>
        <PasswordInput id="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} {...form.register("confirm")} />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting} className="sm:justify-self-start">
        {isSubmitting && <LoaderCircle className="animate-spin" />}
        {submitLabel ?? t("auth.updatePassword")}
      </Button>
    </form>
  );
}
