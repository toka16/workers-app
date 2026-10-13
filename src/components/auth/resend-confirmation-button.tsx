"use client";

import { LoaderCircle, MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition, type ComponentProps } from "react";
import { toast } from "sonner";
import { resendConfirmationAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useCaptcha } from "./captcha";
import { safeAction } from "./use-action-form";

/** Sends the sign-up confirmation e-mail again, for links that expired or never arrived. */
export function ResendConfirmationButton({ email, ...props }: { email: string } & Omit<ComponentProps<typeof Button>, "onClick">) {
  const t = useTranslations();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const captcha = useCaptcha();

  const button = (
    <Button
      type="button"
      variant="outline"
      disabled={pending || sent || !captcha.ready}
      onClick={() =>
        startTransition(async () => {
          const result = await safeAction(() => resendConfirmationAction(email, locale, captcha.token));
          captcha.reset();
          if (result.ok) {
            setSent(true);
            toast.success(t("auth.confirmationResent", { email }));
          } else {
            toast.error(t(`errors.${result.error}`));
          }
        })
      }
      {...props}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : sent && <MailCheck />}
      {sent ? t("auth.confirmationResentShort") : t("auth.resendConfirmation")}
    </Button>
  );
  // Without a configured captcha the widget is null and this is just the button.
  return captcha.widget && !sent ? (
    <div className="grid w-full gap-3">
      {captcha.widget}
      {button}
    </div>
  ) : (
    button
  );
}
