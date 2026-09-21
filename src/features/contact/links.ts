import { messages } from "../../i18n/messages";
import type { Locale, SiteSettings } from "../../types";
import { normalizePhone } from "../../lib/validation";

export interface ProductContact {
  name: string;
  capacity: number;
  price: string;
  url: string;
  variant?: string;
  quantity?: number;
}
export function consultationMessage(
  locale: Locale,
  product?: ProductContact | null,
) {
  const t = messages[locale];
  if (!product) return t.contactGreeting;
  return [
    t.productGreeting,
    product.name,
    `${t.capacity}: ${product.capacity} ${t.eggs}`,
    `${t.price}: ${product.price}`,
    product.variant && `${t.variant}: ${product.variant}`,
    product.quantity && `${t.quantity}: ${product.quantity}`,
    `${t.productLink}: ${product.url}`,
  ]
    .filter(Boolean)
    .join("\n");
}
export function contactLinks(
  settings: Pick<SiteSettings, "phone" | "whatsapp" | "telegram">,
  message: string,
) {
  const phone = normalizePhone(settings.phone);
  const wa = normalizePhone(settings.whatsapp);
  const tg = settings.telegram.trim().replace(/^@/, "");
  return {
    phone: phone ? `tel:${phone}` : null,
    whatsapp: wa
      ? `https://wa.me/${wa.slice(1)}?text=${encodeURIComponent(message)}`
      : null,
    telegram: /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(tg)
      ? `https://t.me/${tg}`
      : null,
  };
}
