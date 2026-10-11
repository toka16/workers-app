const CURRENCY_SYMBOLS: Record<string, string> = { GEL: "₾", USD: "$", EUR: "€" };

export function formatMoney(value: number, currency = "GEL", locale = "ka"): string {
  const amount = new Intl.NumberFormat(locale === "ka" ? "ka-GE" : "en-US", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
  return `${amount} ${CURRENCY_SYMBOLS[currency] ?? currency}`;
}

export function formatPhoneForDisplay(phone: string): string {
  // +995555123456 -> +995 555 12 34 56
  const m = phone.match(/^\+995(\d{3})(\d{2})(\d{2})(\d{2})$/);
  return m ? `+995 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}
