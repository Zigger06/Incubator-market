import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { useStore } from "../app/StoreProvider";
import { useI18n } from "../i18n/Provider";
import { ProductCard, ProductPhoto } from "../components/ProductCard";
import { CatalogStatus } from "../components/Status";
import { ContactLinks } from "../components/ContactLinks";
import { featureLabels } from "../config/site";
import { useContact } from "../features/contact/ContactProvider";
export default function ProductPage() {
  const { slug } = useParams();
  const { products, loading, error, add, favorites, toggleFavorite } =
    useStore();
  const { t, local, money } = useI18n();
  const navigate = useNavigate();
  const { setProduct } = useContact();
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState("");
  const [image, setImage] = useState("");
  const p = products.find((p) => p.slug === slug);
  useEffect(() => {
    setVariant("");
    setQuantity(1);
    setImage("");
  }, [slug]);
  useEffect(() => {
    if (p) document.title = local(p.name) + " — Incubator Market";
  }, [p, local]);
  const v = p?.product_variants.find((v) => v.id === variant);
  useEffect(() => {
    setProduct(
      p
        ? {
            name: local(p.name),
            capacity: p.capacity,
            price: money(v?.price_minor ?? p.price_minor),
            url: window.location.href,
            variant: v ? local(v.name) : undefined,
            quantity,
          }
        : null,
    );
    return () => setProduct(null);
  }, [p, v, local, money, quantity, setProduct]);
  if (loading || error) return <CatalogStatus />;
  if (!p)
    return (
      <div className="empty">
        <h1>{t("notFound")}</h1>
        <Link to="/catalog">{t("catalog")}</Link>
      </div>
    );
  const stock = v?.stock ?? p.stock;
  const contactProduct = {
    name: local(p.name),
    capacity: p.capacity,
    price: money(v?.price_minor ?? p.price_minor),
    url: window.location.href,
    variant: v ? local(v.name) : undefined,
    quantity,
  };
  return (
    <div className="page">
      <Link className="text-link" to="/catalog">
        <ArrowLeft size={17} />
        {t("catalog")}
      </Link>
      <div className="product-detail">
        <div>
          <div className="gallery-main">
            {image ? (
              <img src={image} alt={local(p.name)} />
            ) : (
              <ProductPhoto product={p} />
            )}
          </div>
          <div className="thumbnails">
            {p.product_images.map((img) => (
              <button
                key={img.id}
                onClick={() => setImage(img.url)}
                aria-label={local(p.name) + " " + img.position}
              >
                <img src={img.url} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="product-purchase">
          <span className="eyebrow">
            {t("capacity")} / {p.capacity} {t("eggs")}
          </span>
          <h1>{local(p.name)}</h1>
          <span className="availability">
            {t(stock ? "stock" : "outOfStock")}
          </span>
          <p>{local(p.description)}</p>
          <div className="detail-price">
            {p.old_price_minor && !variant && (
              <del>{money(p.old_price_minor)}</del>
            )}
            <strong>{money(v?.price_minor ?? p.price_minor)}</strong>
          </div>
          {p.product_variants.some((v) => v.active) && (
            <label>
              {t("variant")}
              <select
                value={variant}
                onChange={(e) => {
                  setVariant(e.target.value);
                  setQuantity(1);
                }}
              >
                <option value="">{t("baseVariant")}</option>
                {p.product_variants
                  .filter((v) => v.active)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {local(v.name)} — {money(v.price_minor)}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <div className="actions">
            <label className="quantity-label">
              {t("quantity")}
              <input
                type="number"
                min="1"
                max={Math.min(99, stock)}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
            <button
              className="button primary"
              disabled={
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > stock ||
                quantity > 99
              }
              onClick={() => add(p, quantity, variant || null)}
            >
              {t("add")}
            </button>
            <button
              className="icon"
              aria-label={t("favorites")}
              aria-pressed={favorites.includes(p.id)}
              onClick={() => void toggleFavorite(p.id)}
            >
              <Heart
                fill={favorites.includes(p.id) ? "currentColor" : "none"}
              />
            </button>
          </div>
          <button
            className="button full"
            disabled={
              !Number.isInteger(quantity) ||
              quantity < 1 ||
              quantity > stock ||
              quantity > 99
            }
            onClick={() => {
              add(p, quantity, variant || null);
              navigate("/checkout");
            }}
          >
            {t("buy")}
          </button>
          <ContactLinks product={contactProduct} specialist />
          <p className="muted">
            {t("warrantyText")} {t("deliveryText")}
          </p>
        </div>
      </div>
      <section className="section product-info">
        <div>
          <h2>{t("specifications")}</h2>
          <dl>
            <div>
              <dt>{t("capacity")}</dt>
              <dd>
                {p.capacity} {t("eggs")}
              </dd>
            </div>
            {Object.entries(p.specs).map(([key, val]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
          {p.features.map((f) => (
            <span className="tag" key={f}>
              {featureLabels[f as keyof typeof featureLabels]
                ? local(featureLabels[f as keyof typeof featureLabels])
                : f}
            </span>
          ))}
        </div>
        <div>
          <h2>{t("description")}</h2>
          <p>{local(p.description)}</p>
          <Link className="text-link" to="/warranty">
            {t("warranty")}
          </Link>
          <Link className="text-link" to="/delivery">
            {t("delivery")}
          </Link>
        </div>
      </section>
      <section className="section">
        <h2>{t("related")}</h2>
        <div className="product-grid">
          {products
            .filter(
              (other) =>
                other.category_id === p.category_id && other.id !== p.id,
            )
            .slice(0, 4)
            .map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
        </div>
      </section>
    </div>
  );
}
