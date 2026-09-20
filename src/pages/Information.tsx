import { Link, useParams } from "react-router-dom";
import { useI18n } from "../i18n/Provider";
import { useStore } from "../app/StoreProvider";
import { information, faqs } from "../data/content";
import { ContactLinks } from "../components/ContactLinks";
export default function Information({ kind }: { kind?: string }) {
  const { page } = useParams();
  const key = kind || page || "";
  const { t, local } = useI18n();
  const { categories } = useStore();
  if (key === "categories")
    return (
      <div className="page">
        <h1>{t("categories")}</h1>
        <div className="category-grid">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={"/catalog?category=" + c.id}
              className="category-tile"
            >
              <h2>{local(c.name)}</h2>↗
            </Link>
          ))}
        </div>
      </div>
    );
  if (key === "faq")
    return (
      <div className="page prose">
        <h1>{t("faq")}</h1>
        {faqs.map((f, i) => (
          <details key={i}>
            <summary>{local(f.q)}</summary>
            <p>{local(f.a)}</p>
          </details>
        ))}
        <ContactLinks />
      </div>
    );
  const content = information[key as keyof typeof information];
  if (!content)
    return (
      <div className="empty">
        <h1>404 · {t("notFound")}</h1>
        <Link className="button primary" to="/">
          {t("home")}
        </Link>
      </div>
    );
  return (
    <div className="page prose">
      <span className="eyebrow">INCUBATOR MARKET</span>
      <h1>{local(content.title)}</h1>
      {content.paragraphs.map((p, i) => (
        <p key={i}>{local(p)}</p>
      ))}
      <ContactLinks />
      <Link className="text-link" to="/contact">
        {t("write")}
      </Link>
    </div>
  );
}
