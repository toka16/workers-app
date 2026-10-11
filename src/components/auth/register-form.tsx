"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { signUpAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUpSchema } from "@/domain/schemas";
import { useRouter } from "@/i18n/navigation";
import { PasswordInput } from "./password-input";
import { useActionErrors } from "./use-action-form";

type Values = z.input<typeof signUpSchema>;

export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const { formError, handle } = useActionErrors(form.setError);
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await signUpAction(values, locale);
    if (!handle(result)) return;
    if (result.data.needsConfirmation) {
      setSentTo(values.email);
    } else {
      router.replace("/dashboard/profile");
      router.refresh();
    }
  });

  if (sentTo) {
    return (
      <div className="grid justify-items-center gap-4 rounded-2xl bg-primary-soft p-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
          <MailCheck className="size-7" />
        </span>
        <h2 className="text-xl font-bold">{t("checkEmailTitle")}</h2>
        <p className="text-muted-foreground">{t("checkEmailText", { email: sentTo })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}
      <Field id="fullName" label={t("fullName")} error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...form.register("fullName")} />
      </Field>
      <Field id="email" label={t("email")} error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field id="password" label={t("password")} error={errors.password?.message} hint={t("passwordHint")}>
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Button type="submit" variant="accent" size="lg" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle className="animate-spin" />}
        {t("createAccount")}
      </Button>
    </form>
  );
}
