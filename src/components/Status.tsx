import { useI18n } from "../i18n/Provider";
import { useStore } from "../app/StoreProvider";
export function CatalogStatus() {
  const { t } = useI18n();
  const { loading, error, reload } = useStore();
  if (loading)
    return (
      <div className="status" role="status">
        {t("loading")}
      </div>
    );
  if (error)
    return (
      <div className="status" role="alert">
        <p>{t("genericError")}</p>
        <button onClick={() => void reload()}>{t("retry")}</button>
      </div>
    );
  return null;
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return text ? (
    <p
      className={error ? "alert error" : "alert"}
      role={error ? "alert" : "status"}
    >
      {text}
    </p>
  ) : null;
}
