import { getLocale } from "next-intl/server";
import { firstIncompleteStep, stepHref } from "@/domain/profile-steps";
import { redirect } from "@/i18n/navigation";
import { getOwnProfile } from "@/lib/data/dashboard";

/** Entry point of the editor (sign-up and e-mail confirmation land here): resume at the first unfinished step. */
export default async function ProfilePage({ searchParams }: PageProps<"/[locale]/dashboard/profile">) {
  const [{ profile }, locale, { confirmed }] = await Promise.all([getOwnProfile(), getLocale(), searchParams]);
  // Keep the e-mail confirmation flag so the step can show the "confirmed" message.
  const href = stepHref(firstIncompleteStep(profile));
  redirect({ href: confirmed === "1" ? `${href}?confirmed=1` : href, locale });
}
