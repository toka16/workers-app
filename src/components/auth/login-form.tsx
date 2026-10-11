"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { signInAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signInSchema } from "@/domain/schemas";
import { Link, useRouter } from "@/i18n/navigation";
import { PasswordInput } from "./password-input";
import { useActionErrors } from "./use-action-form";

type Values = z.input<typeof signInSchema>;

function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });
  const { formError, setFormError, handle } = useActionErrors(form.setError);
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "link") setFormError(t("linkInvalid"));
  }, [setFormError, t]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (handle(await signInAction(values))) {
      router.replace(safeNext());
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}
      <Field id="email" label={t("email")} error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field id="password" label={t("password")} error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Link href="/auth/forgot-password" className="-mt-2 justify-self-end text-sm font-medium text-primary hover:underline">
        {t("forgotPassword")}
      </Link>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle className="animate-spin" />}
        {t("signIn")}
      </Button>
    </form>
  );
}
