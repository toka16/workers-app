"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { changePasswordAction } from "@/actions/dashboard";
import { PasswordInput } from "@/components/auth/password-input";
import { useActionErrors } from "@/components/auth/use-action-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { changePasswordSchema } from "@/domain/schemas";

type Values = z.input<typeof changePasswordSchema>;

/** Signed-in password change; asks for the current password so a stolen session isn't enough. */
export function ChangePasswordForm() {
  const t = useTranslations();
  const form = useForm<Values>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: "", password: "", confirm: "" },
  });
  const { formError, setFormError, handle } = useActionErrors(form.setError);
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (handle(await changePasswordAction(values))) {
        toast.success(t("dashboard.account.passwordChangedToast"));
        form.reset();
      }
    } catch {
      setFormError(t("errors.unknown"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}
      <Field id="current" label={t("dashboard.account.currentPassword")} error={errors.current?.message}>
        <PasswordInput id="current" autoComplete="current-password" aria-invalid={!!errors.current} {...form.register("current")} />
      </Field>
      <Field id="password" label={t("auth.newPassword")} error={errors.password?.message} hint={t("auth.passwordHint")}>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Field id="confirm" label={t("auth.confirmPassword")} error={errors.confirm?.message}>
        <PasswordInput id="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} {...form.register("confirm")} />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting} className="sm:justify-self-start">
        {isSubmitting && <LoaderCircle className="animate-spin" />}
        {t("dashboard.account.changePassword")}
      </Button>
    </form>
  );
}
