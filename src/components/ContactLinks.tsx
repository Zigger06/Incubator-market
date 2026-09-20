import { useStore } from "../app/StoreProvider";
import { useI18n } from "../i18n/Provider";
import { MessageCircle, Send, Phone } from "lucide-react";
export function ContactLinks({ message = "" }: { message?: string }) {
  const { settings } = useStore();
  const { t } = useI18n();
  const wa = settings.whatsapp.replace(/\D/g, "");
  const tg = settings.telegram.replace(/^@/, "");
  return (
    <div className="actions">
      {/^992\d{9}$/.test(wa) && (
        <a
          className="button whatsapp"
          href={`https://wa.me/${wa}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
      )}
      {/^[a-zA-Z0-9_]{5,32}$/.test(tg) && (
        <a
          className="button secondary"
          href={`https://t.me/${tg}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Send size={18} />
          Telegram
        </a>
      )}
      {/^\+992\d{9}$/.test(settings.phone) && (
        <a className="button secondary" href={"tel:" + settings.phone}>
          <Phone size={18} />
          {t("phone")}
        </a>
      )}
    </div>
  );
}
