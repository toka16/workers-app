"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveProfileAction } from "@/actions/dashboard";
import { useActionErrors } from "@/components/auth/use-action-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { CategoryIcon } from "@/components/workers/category-icon";
import type { Category, City, WorkerProfile } from "@/domain/models";
import { profileSchema, type ProfileInput } from "@/domain/schemas";
import { localized } from "@/i18n/localized";
import { useRouter } from "@/i18n/navigation";
import { slugify } from "@/lib/slugify";
import { AvatarUploader } from "./avatar-uploader";
import { ChipPicker } from "./chip-picker";

interface Props {
  profile: WorkerProfile;
  categories: Category[];
  cities: City[];
}

type FormValues = {
  fullName: string;
  slug: string;
  headline: string;
  bio: string;
  yearsExperience: string;
  cityIds: number[];
  categoryIds: number[];
  contacts: Record<"phone" | "whatsapp" | "viber" | "telegram" | "email" | "facebook" | "website", string>;
};

export function ProfileForm({ profile, categories, cities }: Props) {
  const t = useTranslations("dashboard.profile");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const form = useForm<FormValues, unknown, ProfileInput>({
    // The schema accepts form strings and normalizes them (empty -> null, numbers, trimming).
    resolver: zodResolver(profileSchema) as never,
    defaultValues: {
      fullName: profile.fullName,
      slug: profile.slug,
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
    },
  });
  const { register, control, formState, setValue, getFieldState } = form;
  const { errors, isSubmitting } = formState;
  const { formError, handle } = useActionErrors(form.setError);

  // Suggest a readable address from the name until the worker edits it themselves.
  const nameField = register("fullName", {
    onChange: (e) => {
      const slugState = getFieldState("slug");
      if (!slugState.isDirty && profile.slug.startsWith("worker-")) {
        const suggestion = slugify(e.target.value);
        if (suggestion.length >= 3) setValue("slug", `${suggestion}-${profile.id.slice(0, 4)}`);
      }
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (handle(await saveProfileAction(values))) {
      toast.success(t("savedToast"));
      form.reset(form.getValues());
      router.refresh();
    }
  });

  const contact = (key: keyof FormValues["contacts"], label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Field id={`contacts.${key}`} label={label} error={errors.contacts?.[key]?.message} optional>
      <Input id={`contacts.${key}`} aria-invalid={!!errors.contacts?.[key]} {...register(`contacts.${key}`)} {...props} />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      {formError && <Alert variant="error">{formError}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>{t("basics")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <AvatarUploader userId={profile.id} name={profile.fullName} url={profile.avatar?.url ?? null} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="fullName" label={t("fullName")} error={errors.fullName?.message}>
              <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...nameField} />
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
          <Field id="slug" label={t("slug")} error={errors.slug?.message} hint={t("slugHint")}>
            <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-muted focus-within:border-primary focus-within:ring-4 focus-within:ring-ring/15">
              <span className="flex items-center px-3 text-sm text-muted-foreground select-none">/workers/</span>
              <input
                id="slug"
                className="h-11 min-w-0 flex-1 bg-surface px-3 text-base outline-none sm:text-sm"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={!!errors.slug}
                {...register("slug")}
              />
            </div>
          </Field>
        </CardContent>
      </Card>

      <Card id="area" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>{t("workArea")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-7">
          <Field id="categoryIds" label={t("categories")} error={errors.categoryIds?.message} hint={t("categoriesHint")}>
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
          <Field id="cityIds" label={t("cities")} error={errors.cityIds?.message}>
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

      <Card id="contacts" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>{t("contacts")}</CardTitle>
          <CardDescription>{t("contactsHint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {contact("phone", t("phone"), { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+995 5XX XX XX XX" })}
          {contact("whatsapp", t("whatsapp"), { type: "tel", inputMode: "tel", placeholder: "+995 5XX XX XX XX" })}
          {contact("viber", t("viber"), { type: "tel", inputMode: "tel", placeholder: "+995 5XX XX XX XX" })}
          {contact("telegram", t("telegram"), { placeholder: "@username", autoCapitalize: "none" })}
          {contact("email", t("contactEmail"), { type: "email", inputMode: "email" })}
          {contact("facebook", t("facebook"), { type: "url", placeholder: "https://facebook.com/…" })}
          {contact("website", t("website"), { type: "url", placeholder: "https://…" })}
        </CardContent>
      </Card>

      {/* Sticky save bar keeps the action reachable on long forms and small screens. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:shadow-lift">
        <div className="flex items-center justify-end gap-3">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
            {isSubmitting ? tc("saving") : tc("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
