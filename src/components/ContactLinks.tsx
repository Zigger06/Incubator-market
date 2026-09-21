import { Link } from "react-router-dom";
import { useStore } from "../app/StoreProvider";
import { useI18n } from "../i18n/Provider";
import { MessageCircle, Send, Phone, ArrowUpRight } from "lucide-react";
import {
  consultationMessage,
  contactLinks,
  type ProductContact,
} from "../features/contact/links";
export function ContactLinks({
  product,
  specialist = false,
  onNavigate,
}: {
  product?: ProductContact | null;
  specialist?: boolean;
  onNavigate?: () => void;
}) {
  const { settings } = useStore();
  const { t, locale } = useI18n();
  const links = contactLinks(settings, consultationMessage(locale, product));
  return (
    <div className="contact-links">
      <div className="actions">
        {(
          [
            ["whatsapp", "WhatsApp", MessageCircle],
            ["telegram", "Telegram", Send],
            ["phone", t("phoneCall"), Phone],
          ] as const
        ).map(([key, label, Icon]) =>
          links[key] ? (
            <a
              key={key}
              className={`button ${key === "whatsapp" ? "whatsapp" : "secondary"}`}
              href={links[key]!}
              target={key === "phone" ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              <Icon size={18} />
              {label}
            </a>
          ) : (
            key !== "phone" && (
              <span
                key={key}
                className="channel-unavailable"
                aria-disabled="true"
              >
                <Icon size={18} />
                <span>
                  {label}
                  <small>{t("channelUnavailable")}</small>
                </span>
              </span>
            )
          ),
        )}
      </div>
      {specialist && (
        <Link
          className="button secondary specialist-link"
          to="/contact"
          onClick={onNavigate}
        >
          {t("writeSpecialist")}
          <ArrowUpRight size={18} />
        </Link>
      )}
      {!links.whatsapp && !links.telegram && !links.phone && (
        <p className="form-note">{t("contactSetupNote")}</p>
      )}
    </div>
  );
}
