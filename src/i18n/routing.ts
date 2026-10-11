import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/domain/models";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // Georgian lives at "/", English at "/en". Many Georgian visitors use English-language
  // browsers, so we don't redirect based on Accept-Language.
  localePrefix: "as-needed",
  localeDetection: false,
});
