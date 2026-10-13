"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveProfileAction } from "@/actions/dashboard";
import { safeAction, useActionErrors } from "@/components/auth/use-action-form";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { CategoryIcon } from "@/components/workers/category-icon";
import type { Category, City, WorkerProfile } from "@/domain/models";
import { stepHref, type ProfileStep } from "@/domain/profile-steps";
import { profileSchema, type ProfileInput } from "@/domain/schemas";
import { localized } from "@/i18n/localized";
import { useRouter } from "@/i18n/navigation";
import { AvatarUploader } from "../avatar-uploader";
import { ChipPicker } from "../chip-picker";
import { GuardedLink, useEditorGuard } from "./editor-guard";
import { StepFooter } from "./step-footer";

type FieldsStep = Extract<ProfileStep, "basics" | "area" | "contacts">;

interface Props {
  step: FieldsStep;
  profile: WorkerProfile;
  categories: Category[];
  cities: City[];
  prev: ProfileStep | null;
  next: ProfileStep;
  canSkip: boolean;
}

type FormValues = {
  fullName: string;
  headline: string;
  bio: string;
  yearsExperience: string;
  cityIds: number[];
  categoryIds: number[];
  contacts: Record<"phone" | "whatsapp" | "viber" | "telegram" | "email" | "facebook" | "website", string>;
};

/** Which step shows each form field, so errors on fields that aren't on screen can point there. */
const FIELD_STEPS: Record<keyof FormValues, FieldsStep> = {
  fullName: "basics",
  headline: "basics",
  bio: "basics",
  yearsExperience: "basics",
  categoryIds: "area",
  cityIds: "area",
  contacts: "contacts",
};

function formValues(profile: WorkerProfile): FormValues {
  return {
    fullName: profile.fullName,
    headline: profile.headline,
    bio: profile.bio,
    yearsExperience: profile.yearsExperience?.toString() ?? "",
    cityIds: profile.cities.map((c) => c.id),
    categoryIds: profile.categories.map((c) => c.id),
    contacts: {
      phone: profile.contacts.phone ?? "",
      whatsapp: profile.contacts.whatsapp ?? "",
      viber: profile.contacts.viber ?? "",
      telegram: profile.contacts.telegram ?? "",
      email: profile.contacts.email ?? "",
      facebook: profile.contacts.facebook ?? "",
      website: profile.contacts.website ?? "",
    },
  };
}

/**
 * The profile-table steps (about you, work area, contacts). Each one shows only its own fields but saves
 * the whole profile through the same action, so every save leaves a consistent profile behind.
 */
export function ProfileFieldsStep({ step, profile, categories, cities, prev, next, canSkip }: Props) {
  const t = useTranslations("dashboard.profile");
  const te = useTranslations("dashboard.editor");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const guard = useEditorGuard();

  const form = useForm<FormValues, unknown, ProfileInput>({
    // The schema accepts form strings and normalizes them (empty -> null, numbers, trimming).
    resolver: zodResolver(profileSchema) as never,
    defaultValues: formValues(profile),
  });
  const { register, control, formState } = form;
  const { errors, isSubmitting, isDirty } = formState;
  const { formError, handle } = useActionErrors(form.setError);

  const setDirty = guard?.setDirty;
  useEffect(() => {
    setDirty?.(isDirty);
  }, [isDirty, setDirty]);
  useEffect(() => () => setDirty?.(false), [setDirty]);

  const otherStep = (Object.keys(errors) as (keyof FormValues)[]).map((key) => FIELD_STEPS[key]).find((s) => s && s !== step);

  const onSubmit = form.handleSubmit(async (values) => {
    // Nothing changed: just move on, there's nothing to save.
    if (isDirty && !handle(await safeAction(() => saveProfileAction(values)))) return;
    if (isDirty) {
      toast.success(profile.isPublished ? te("savedLive") : te("savedHidden"));
      form.reset(form.getValues());
      setDirty?.(false);
    }
    if (guard) guard.navigate(stepHref(next));
    else router.push(stepHref(next));
  });

  const contact = (key: keyof FormValues["contacts"], label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Field id={`contacts.${key}`} label={label} error={errors.contacts?.[key]?.message} optional>
      <Input id={`contacts.${key}`} aria-invalid={!!errors.contacts?.[key]} {...register(`contacts.${key}`)} {...props} />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-6">
      {formError && <Alert variant="error">{formError}</Alert>}
      {otherStep && (
        <Alert variant="error">
          {te("fixOtherStep", { step: te(`steps.${otherStep}.title`) })}{" "}
          <GuardedLink href={stepHref(otherStep)} className="inline-flex items-center gap-1 font-semibold underline underline-offset-4">
            {te("goToStep", { step: te(`steps.${otherStep}.title`) })} <ArrowRight className="size-3.5" />
          </GuardedLink>
        </Alert>
      )}

      {step === "basics" && (
        <Card>
          <CardContent className="grid gap-6 pt-5 sm:pt-6">
            <AvatarUploader userId={profile.id} name={profile.fullName} url={profile.avatar?.url ?? null} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="fullName" label={t("fullName")} error={errors.fullName?.message}>
                <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register("fullName")} />
              </Field>
              <Field id="yearsExperience" label={t("yearsExperience")} error={errors.yearsExperience?.message} optional>
                <Input id="yearsExperience" inputMode="numeric" aria-invalid={!!errors.yearsExperience} {...register("yearsExperience")} />
              </Field>
            </div>
            <Field id="headline" label={t("headline")} error={errors.headline?.message} optional>
              <Input id="headline" placeholder={t("headlinePlaceholder")} maxLength={160} aria-invalid={!!errors.headline} {...register("headline")} />
            </Field>
            <Field id="bio" label={t("bio")} error={errors.bio?.message} optional>
              <Textarea id="bio" rows={6} placeholder={t("bioPlaceholder")} maxLength={4000} aria-invalid={!!errors.bio} {...register("bio")} />
            </Field>
          </CardContent>
        </Card>
      )}

      {step === "area" && (
        <Card>
          <CardContent className="grid gap-7 pt-5 sm:pt-6">
            <Field id="categoryIds" group label={t("categories")} error={errors.categoryIds?.message} hint={t("categoriesHint")}>
              <Controller
                control={control}
                name="categoryIds"
                render={({ field }) => (
                  <ChipPicker
                    max={8}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.categoryIds}
                    options={categories.map((c) => ({
                      id: c.id,
                      label: localized(c.name, locale),
                      icon: <CategoryIcon icon={c.icon} className="size-4 text-primary" />,
                    }))}
                  />
                )}
              />
            </Field>
            <Field id="cityIds" group label={t("cities")} error={errors.cityIds?.message}>
              <Controller
                control={control}
                name="cityIds"
                render={({ field }) => (
                  <ChipPicker
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.cityIds}
                    options={cities.map((c) => ({ id: c.id, label: localized(c.name, locale) }))}
                  />
                )}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {step === "contacts" && (
        <Card>
          <CardContent className="grid gap-5 pt-5 sm:pt-6">
            {/* Set by the server when a live profile would be left without any contact. */}
            {errors.contacts?.message && (
              <Alert variant="error">{tv(errors.contacts.message)}</Alert>
            )}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {contact("phone", t("phone"), { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+995 5XX XX XX XX" })}
              {contact("whatsapp", t("whatsapp"), { type: "tel", inputMode: "tel", placeholder: "+995 5XX XX XX XX" })}
              {contact("viber", t("viber"), { type: "tel", inputMode: "tel", placeholder: "+995 5XX XX XX XX" })}
              {contact("telegram", t("telegram"), { placeholder: "@username", autoCapitalize: "none" })}
              {contact("email", t("contactEmail"), { type: "email", inputMode: "email", autoComplete: "email" })}
              {contact("facebook", t("facebook"), { type: "url", placeholder: "https://facebook.com/…" })}
              {contact("website", t("website"), { type: "url", placeholder: "https://…" })}
            </div>
          </CardContent>
        </Card>
      )}

      <StepFooter prev={prev} next={next} canSkip={canSkip} mode="submit" submitting={isSubmitting} />
    </form>
  );
}
