import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import { useI18n } from "../../i18n/Provider";
import { ContactLinks } from "../../components/ContactLinks";
import { useContact } from "./ContactProvider";
export function ContactWidget() {
  const { t } = useI18n();
  const { product } = useContact();
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    ref.current?.close();
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <>
      <button
        ref={trigger}
        className="contact-trigger"
        aria-label={t("contactUs")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="contact-dialog"
        onClick={() => {
          ref.current?.showModal();
          setOpen(true);
        }}
      >
        <MessageCircle size={22} />
        <span>{t("contactUs")}</span>
      </button>
      <dialog
        id="contact-dialog"
        ref={ref}
        className="contact-dialog"
        aria-labelledby="contact-title"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const focusable = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
            ),
          );
          const first = focusable[0],
            last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) ref.current?.close();
        }}
      >
        <div className="contact-dialog-body">
          <div className="section-heading">
            <h2 id="contact-title">{t("contactUs")}</h2>
            <button
              className="icon"
              aria-label={t("close")}
              onClick={() => ref.current?.close()}
            >
              <X />
            </button>
          </div>
          <p className="muted">{t("supportText")}</p>
          {product && (
            <p className="contact-product">
              {product.name} · {product.capacity} {t("eggs")}
            </p>
          )}
          <ContactLinks
            product={product}
            specialist
            onNavigate={() => ref.current?.close()}
          />
        </div>
      </dialog>
    </>
  );
}
