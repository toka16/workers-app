"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { signInAction } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signInSchema } from "@/domain/schemas";
import { Link, useRouter } from "@/i18n/navigation";
import { safeNext } from "@/lib/safe-redirect";
import { useCaptcha } from "./captcha";
import { PasswordInput } from "./password-input";
import { ResendConfirmationButton } from "./resend-confirmation-button";
import { safeAction, useActionErrors } from "./use-action-form";

type Values = z.input<typeof signInSchema>;

function nextPath(): string {
  return safeNext(new URLSearchParams(window.location.search).get("next"));
}

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });
  const { formError, setFormError, handle } = useActionErrors(form.setError);
  const { errors, isSubmitting } = form.formState;
  // Stays set while the dashboard loads, so the button doesn't re-enable between sign-in and navigation.
  const [signedIn, setSignedIn] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const captcha = useCaptcha();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "link") setFormError(t("linkInvalid"));
  }, [setFormError, t]);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await safeAction(() => signInAction(values, captcha.token));
    if (!result.ok) captcha.reset();
    setUnconfirmedEmail(!result.ok && result.error === "email_not_confirmed" ? values.email : null);
    if (handle(result)) {
      setSignedIn(true);
      router.replace(nextPath());
      router.refresh();
    }
  });
  const busy = isSubmitting || signedIn;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError && <Alert variant="error">{formError}</Alert>}
      {unconfirmedEmail && <ResendConfirmationButton email={unconfirmedEmail} className="-mt-2 justify-self-start" />}
      <Field id="email" label={t("email")} error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field id="password" label={t("password")} error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Link href="/auth/forgot-password" className="-mt-2 justify-self-end text-sm font-medium text-primary hover:underline">
        {t("forgotPassword")}
      </Link>
      {captcha.widget}
      <Button type="submit" size="lg" disabled={busy || !captcha.ready}>
        {busy && <LoaderCircle className="animate-spin" />}
        {t("signIn")}
      </Button>
    </form>
  );
}
