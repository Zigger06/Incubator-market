import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Truck,
  ShieldCheck,
  BookOpen,
  Wrench,
} from "lucide-react";
import { useI18n } from "../i18n/Provider";
import { useStore } from "../app/StoreProvider";
import { ProductCard } from "../components/ProductCard";
import { CatalogStatus } from "../components/Status";
export default function Home() {
  const { t, local } = useI18n();
  const { settings, categories, products } = useStore();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{t("heroKicker")}</span>
          <h1>{local(settings.hero)}</h1>
          <p>{t("heroText")}</p>
          <div className="actions">
            <Link to="/catalog" className="button primary">
              {t("catalog")} <ArrowUpRight size={20} />
            </Link>
            <Link to="/contact" className="hero-contact">
              {t("consult")} <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-foot">
            <span>
              30—500 <small>{t("eggs")}</small>
            </span>
            <span>
              {t("training")}
              <br />
              {t("support")}
            </span>
          </div>
        </div>
        <div className="hero-image">
          <img
            src={import.meta.env.BASE_URL + "chicks-hero.webp"}
            alt={t("heroTag")}
            width="1200"
            height="800"
            fetchPriority="high"
          />
          <div className="hero-stamp">
            <span>01 /</span>
            <p>{t("heroTag")}</p>
            <ArrowUpRight size={30} />
          </div>
        </div>
      </section>
      <section className="benefits">
        {[
          [Truck, "delivery", "deliveryText"],
          [ShieldCheck, "warranty", "warrantyText"],
          [BookOpen, "training", "trainingText"],
          [Wrench, "parts", "partsText"],
        ].map(([Icon, title, desc]) => {
          const I = Icon as typeof Truck;
          return (
            <div key={String(title)}>
              <I size={25} />
              <div>
                <strong>{t(title as "delivery")}</strong>
                <p>{t(desc as "deliveryText")}</p>
              </div>
            </div>
          );
        })}
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">01 / {t("categories")}</span>
            <h2>{t("choose")}</h2>
          </div>
          <p>{t("chooseText")}</p>
        </div>
        <div className="category-grid">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              className="category-tile"
              to={"/catalog?category=" + c.id}
            >
              <span className="category-number">0{i + 1}</span>
              <div>
                <h3>{local(c.name)}</h3>
                <span>
                  {products.filter((p) => p.category_id === c.id).length}{" "}
                  {t("results")}
                </span>
              </div>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">02 / {t("catalog")}</span>
            <h2>{t("featured")}</h2>
          </div>
          <Link to="/catalog" className="text-link">
            {t("seeAll")} <ArrowRight size={18} />
          </Link>
        </div>
        <CatalogStatus />
        <div className="product-grid">
          {products
            .filter((p) => p.featured)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      <section className="support-banner">
        <div>
          <span className="eyebrow">INCUBATOR MARKET</span>
          <h2>{t("support")}</h2>
          <p>{t("supportText")}</p>
        </div>
        <Link className="button primary" to="/contact">
          {t("write")} <ArrowUpRight size={20} />
        </Link>
      </section>
    </>
  );
}
