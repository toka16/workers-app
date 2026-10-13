import { getLocale } from "next-intl/server";
import { stepHref } from "@/domain/profile-steps";
import { redirect } from "@/i18n/navigation";

/** Moved into the profile editor; kept so old links and bookmarks still work. */
export default async function PortfolioPage() {
  redirect({ href: stepHref("portfolio"), locale: await getLocale() });
}
