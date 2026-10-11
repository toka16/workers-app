import type { Locale, LocalizedText } from "@/domain/models";

export function localized(text: LocalizedText, locale: string): string {
  return text[(locale as Locale) in text ? (locale as Locale) : "ka"];
}
