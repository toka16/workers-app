import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkerProfileView } from "@/components/workers/worker-profile-view";
import type { WorkerProfile } from "@/domain/models";
import { getCategories, getPublishedWorker } from "@/lib/data/public";
import { siteUrl } from "@/lib/site";

type Props = PageProps<"/[locale]/workers/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const worker = await getPublishedWorker(slug);
  if (!worker) return {};
  const t = await getTranslations("meta");
  const description = t("profileDescription", { name: worker.fullName, headline: worker.headline || worker.categories.map((c) => c.name[locale === "en" ? "en" : "ka"]).join(", ") });
  const image = worker.portfolio[0]?.image.url ?? worker.avatar?.url;
  return {
    title: worker.fullName,
    description,
    alternates: { canonical: locale === "ka" ? `/workers/${slug}` : `/en/workers/${slug}`, languages: { ka: `/workers/${slug}`, en: `/en/workers/${slug}` } },
    openGraph: { title: worker.fullName, description, type: "profile", images: image ? [image] : [] },
  };
}

export default function WorkerPage({ params }: Props) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <WorkerProfile params={params} />
    </Suspense>
  );
}

async function WorkerProfile({ params }: Pick<Props, "params">) {
  const { slug, locale } = await params;
  const [worker, categories] = await Promise.all([getPublishedWorker(slug), getCategories()]);
  if (!worker) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(worker, locale) }}
      />
      <WorkerProfileView worker={worker} categories={categories} />
    </>
  );
}

function jsonLd(worker: WorkerProfile, locale: string): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: worker.fullName,
    description: worker.headline || undefined,
    url: `${siteUrl()}${locale === "ka" ? "" : `/${locale}`}/workers/${worker.slug}`,
    image: worker.avatar?.url,
    telephone: worker.contacts.phone ?? undefined,
    email: worker.contacts.email ?? undefined,
    areaServed: worker.cities.map((c) => ({ "@type": "City", name: c.name.en })),
    makesOffer: worker.services.map((s) => ({
      "@type": "Offer",
      name: s.title,
      price: s.priceFrom ?? undefined,
      priceCurrency: s.currency,
    })),
  };
  // Escape "<" so user content can't close the script tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function ProfileSkeleton() {
  return (
    <div>
      <Skeleton className="h-40 rounded-none sm:h-56" />
      <div className="container-page -mt-16 grid gap-6">
        <Skeleton className="size-28 rounded-full border-4 border-background sm:size-32" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
        </div>
      </div>
    </div>
  );
}
