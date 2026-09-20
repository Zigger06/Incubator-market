import { useState, type FormEvent } from "react";
import { useI18n } from "../i18n/Provider";
import { useStore } from "../app/StoreProvider";
import { ContactLinks } from "../components/ContactLinks";
import { Notice } from "../components/Status";
import { contactSchema } from "../lib/validation";
import { sendContact } from "../services/orders";
import { isDemo } from "../lib/supabase";
import type { MessageKey } from "../i18n/messages";
export default function Contact() {
  const { t, local } = useI18n();
  const { settings } = useStore();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const result = contactSchema.safeParse(
      Object.fromEntries(new FormData(form)),
    );
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await sendContact(result.data);
      setSent(true);
      form.reset();
    } catch {
      setError("genericError");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <div className="page-title">
        <span className="eyebrow">INCUBATOR MARKET</span>
        <h1>{t("contact")}</h1>
      </div>
      <div className="contact-grid">
        <div>
          <h2>{t("support")}</h2>
          <p>{t("supportText")}</p>
          <h3>{t("address")}</h3>
          <p>{local(settings.address)}</p>
          <h3>{t("hours")}</h3>
          <p>{settings.hours}</p>
          <ContactLinks />
        </div>
        <form className="panel" onSubmit={submit}>
          <h2>{t("write")}</h2>
          <div className="two-fields">
            <label>
              {t("name")}
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
              />
            </label>
            <label>
              {t("phone")}
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+992 XX XXX XX XX"
                required
              />
            </label>
          </div>
          <label>
            {t("subject")}
            <input name="subject" required minLength={2} maxLength={150} />
          </label>
          <label>
            {t("message")}
            <textarea name="message" required minLength={10} maxLength={3000} />
          </label>
          <div className="honeypot" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <p className="muted">{t("privacyNote")}</p>
          <Notice text={sent ? t("sent") : ""} />
          <Notice
            error
            text={
              error
                ? t(
                    (["required", "phoneError", "messageError"].includes(error)
                      ? error
                      : "genericError") as MessageKey,
                  )
                : ""
            }
          />
          {isDemo && <Notice text={t("unavailable")} />}
          <button className="button primary" disabled={busy || isDemo}>
            {t(busy ? "loading" : "send")}
          </button>
        </form>
      </div>
    </div>
  );
}
