"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { forgotPasswordAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/domain/schemas";
import { useCaptcha } from "./captcha";
import { safeAction, useActionErrors } from "./use-action-form";

type Values = z.input<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const { formError, handle } = useActionErrors(form.setError);
  const { errors, isSubmitting } = form.formState;
  const captcha = useCaptcha();

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await safeAction(() => forgotPasswordAction(values, locale, captcha.token));
    captcha.reset();
    if (handle(result)) setSentTo(values.email);
  });

  if (sentTo) return <Alert variant="success">{t("resetSentText", { email: sentTo })}</Alert>;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}
      <Field id="email" label={t("email")} error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      {captcha.widget}
      <Button type="submit" size="lg" disabled={isSubmitting || !captcha.ready}>
        {isSubmitting && <LoaderCircle className="animate-spin" />}
        {t("sendResetLink")}
      </Button>
    </form>
  );
}
