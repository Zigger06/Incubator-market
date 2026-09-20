import { useState, type FormEvent } from "react";
import type { SiteSettings } from "../../types";
import { useI18n } from "../../i18n/Provider";
import { saveSettings } from "../../services/admin";
import { Notice } from "../../components/Status";
export function SettingsEditor({
  settings,
  onSaved,
}: {
  settings: SiteSettings;
  onSaved: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) || "").trim();
    const value: SiteSettings = {
      name: s("name"),
      phone: s("phone"),
      whatsapp: s("whatsapp"),
      telegram: s("telegram"),
      hours: s("hours"),
      address: { tj: s("address_tj"), ru: s("address_ru") },
      hero: { tj: s("hero_tj"), ru: s("hero_ru") },
      delivery: { tj: s("delivery_tj"), ru: s("delivery_ru") },
    };
    setBusy(true);
    try {
      await saveSettings(value);
      await onSaved();
      setMessage(t("saved"));
    } catch {
      setMessage(t("genericError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel" onSubmit={submit}>
      <h2>{t("settings")}</h2>
      <label>
        {t("name")}
        <input
          name="name"
          defaultValue={settings.name}
          required
          maxLength={100}
        />
      </label>
      <div className="two-fields">
        <label>
          {t("phone")}
          <input
            name="phone"
            defaultValue={settings.phone}
            placeholder="+992…"
            pattern="\+992[0-9]{9}"
          />
        </label>
        <label>
          WhatsApp
          <input
            name="whatsapp"
            defaultValue={settings.whatsapp}
            placeholder="992…"
            pattern="[+]?992[0-9]{9}"
          />
        </label>
        <label>
          Telegram
          <input
            name="telegram"
            defaultValue={settings.telegram}
            placeholder="username"
            pattern="@?[a-zA-Z0-9_]{5,32}"
          />
        </label>
        <label>
          {t("hours")}
          <input
            name="hours"
            defaultValue={settings.hours}
            required
            maxLength={50}
          />
        </label>
      </div>
      {(["address", "hero", "delivery"] as const).map((key) => (
        <div className="two-fields" key={key}>
          {(["tj", "ru"] as const).map((l) => (
            <label key={l}>
              {key === "hero" ? "Hero" : t(key)} · {l.toUpperCase()}
              <textarea
                name={key + "_" + l}
                defaultValue={settings[key][l]}
                required
                maxLength={1000}
              />
            </label>
          ))}
        </div>
      ))}
      <Notice text={message} />
      <button className="button primary" disabled={busy}>
        {t("save")}
      </button>
    </form>
  );
}
