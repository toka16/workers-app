"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, LoaderCircle, Pencil, Plus, Tag, Trash } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { deleteServiceAction, reorderServicesAction, saveServiceAction } from "@/actions/dashboard";
import { safeAction, useActionErrors } from "@/components/auth/use-action-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { CategoryIcon } from "@/components/workers/category-icon";
import { PriceTag } from "@/components/workers/price-tag";
import { PRICE_UNITS, type Category, type Service } from "@/domain/models";
import { serviceSchema, type ServiceInput } from "@/domain/schemas";
import { localized } from "@/i18n/localized";
import { useRouter } from "@/i18n/navigation";
import { ConfirmDialog } from "./confirm-dialog";

export function ServiceManager({
  services,
  categories,
  defaultCategoryId,
}: {
  services: Service[];
  categories: Category[];
  /** Pre-selected for new services: the worker's main category. */
  defaultCategoryId: number | null;
}) {
  const t = useTranslations("dashboard.services");
  const tc = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  // Whether the open service form has unsaved input; closing it then asks before throwing it away.
  const formDirty = useRef(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  function closeEditor() {
    formDirty.current = false;
    setConfirmDiscard(false);
    setEditing(null);
  }
  const [items, setItems] = useState(services);
  const [, startTransition] = useTransition();

  // Re-sync with fresh server data after router.refresh().
  const [source, setSource] = useState(services);
  if (source !== services) {
    setSource(services);
    setItems(services);
  }

  function move(index: number, delta: number) {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setItems(next); // optimistic
    startTransition(async () => {
      const result = await safeAction(() => reorderServicesAction(next.map((s) => s.id)));
      if (!result.ok) {
        setItems(services);
        toast.error(tc(`errors.${result.error}`));
      }
      router.refresh();
    });
  }

  async function remove(id: string) {
    const result = await safeAction(() => deleteServiceAction(id));
    if (!result.ok) {
      toast.error(tc(`errors.${result.error}`));
      return;
    }
    toast.success(t("deletedToast"));
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")} variant="accent">
          <Plus /> {t("add")}
        </Button>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="grid justify-items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-14 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
            <Tag className="size-6" />
          </span>
          {t("empty")}
        </button>
      ) : (
        <Card className="divide-y divide-border">
          {items.map((s, i) => {
            const category = categories.find((c) => c.id === s.categoryId);
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                <div className="flex flex-col">
                  {/* Compact with a mouse, full 44px targets on touch screens. */}
                  <Button variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t("moveUp")} className="pointer-coarse:size-11">
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={i === items.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={t("moveDown")}
                    className="pointer-coarse:size-11"
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <div className="grid min-w-0 flex-1 gap-1">
                  <p className="font-semibold">{s.title}</p>
                  {s.description && <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                  {category && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CategoryIcon icon={category.icon} className="size-3.5" />
                      {localized(category.name, locale)}
                    </span>
                  )}
                </div>
                <PriceTag
                  priceFrom={s.priceFrom}
                  priceTo={s.priceTo}
                  unit={s.priceUnit}
                  currency={s.currency}
                  className="font-bold text-primary"
                />
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label={t("edit")}>
                    <Pencil />
                  </Button>
                  <ConfirmDialog
                    title={t("deleteConfirm")}
                    description={s.title}
                    onConfirm={() => remove(s.id)}
                    trigger={
                      <Button variant="ghost" size="icon" className="text-destructive" aria-label={t("deleteConfirm")}>
                        <Trash />
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (open) return;
          if (formDirty.current) setConfirmDiscard(true);
          else closeEditor();
        }}
      >
        <DialogContent className="max-h-[92dvh]" aria-describedby={undefined}>
          {editing !== null && (
            <ServiceForm
              service={editing === "new" ? null : editing}
              categories={categories}
              defaultCategoryId={defaultCategoryId}
              onDirtyChange={(dirty) => (formDirty.current = dirty)}
              onDone={() => {
                closeEditor();
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc("dashboard.editor.discardTitle")}</DialogTitle>
            <DialogDescription>{t("discardText")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDiscard(false)}>
              {tc("dashboard.editor.keepEditing")}
            </Button>
            <Button variant="destructive" onClick={closeEditor}>
              {tc("dashboard.editor.discard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type FormValues = {
  title: string;
  description: string;
  categoryId: string;
  priceUnit: (typeof PRICE_UNITS)[number];
  priceFrom: string;
  priceTo: string;
};

function ServiceForm({
  service,
  categories,
  defaultCategoryId,
  onDirtyChange,
  onDone,
}: {
  service: Service | null;
  categories: Category[];
  defaultCategoryId: number | null;
  onDirtyChange: (dirty: boolean) => void;
  onDone: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const form = useForm<FormValues, unknown, ServiceInput>({
    resolver: zodResolver(serviceSchema) as never,
    defaultValues: {
      title: service?.title ?? "",
      description: service?.description ?? "",
      categoryId: (service ? service.categoryId : defaultCategoryId)?.toString() ?? "",
      priceUnit: service?.priceUnit ?? "fixed",
      priceFrom: service?.priceFrom?.toString() ?? "",
      priceTo: service?.priceTo?.toString() ?? "",
    },
  });
  const { errors, isSubmitting, isDirty } = form.formState;
  const { formError, handle } = useActionErrors(form.setError);
  const negotiable = useWatch({ control: form.control, name: "priceUnit" }) === "negotiable";

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (handle(await safeAction(() => saveServiceAction(service?.id ?? null, values)))) {
      toast.success(t("dashboard.services.savedToast"));
      onDone();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
      <DialogHeader>
        <DialogTitle>{service ? t("dashboard.services.edit") : t("dashboard.services.add")}</DialogTitle>
      </DialogHeader>
      <DialogBody className="grid gap-5">
        {formError && <Alert variant="error">{formError}</Alert>}
        <Field id="title" label={t("dashboard.services.serviceTitle")} error={errors.title?.message}>
          <Input id="title" placeholder={t("dashboard.services.serviceTitlePlaceholder")} aria-invalid={!!errors.title} {...form.register("title")} />
        </Field>
        <Field id="categoryId" label={t("dashboard.services.category")}>
          <NativeSelect id="categoryId" {...form.register("categoryId")}>
            <option value="">{t("dashboard.services.noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {localized(c.name, locale)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="priceUnit" label={t("dashboard.services.priceUnit")}>
          <NativeSelect id="priceUnit" {...form.register("priceUnit")}>
            {PRICE_UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`priceUnit.${u}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {!negotiable && (
          <div className="grid grid-cols-2 gap-4">
            <Field id="priceFrom" label={t("dashboard.services.priceFrom")} error={errors.priceFrom?.message}>
              <Input id="priceFrom" inputMode="decimal" aria-invalid={!!errors.priceFrom} {...form.register("priceFrom")} />
            </Field>
            <Field id="priceTo" label={t("dashboard.services.priceTo")} error={errors.priceTo?.message} optional>
              <Input id="priceTo" inputMode="decimal" aria-invalid={!!errors.priceTo} {...form.register("priceTo")} />
            </Field>
          </div>
        )}
        <Field id="description" label={t("dashboard.services.description")} error={errors.description?.message} optional>
          <Textarea id="description" rows={3} maxLength={1000} {...form.register("description")} />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {t("common.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
