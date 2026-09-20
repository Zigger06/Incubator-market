import { Link } from "react-router-dom";
import { Heart, ArrowUpRight, ShoppingBag, ImageOff } from "lucide-react";
import type { Product } from "../types";
import { useI18n } from "../i18n/Provider";
import { useStore } from "../app/StoreProvider";
import { isDemo } from "../lib/supabase";
export function ProductPhoto({ product }: { product: Product }) {
  const { local, t } = useI18n();
  const image = product.product_images
    .slice()
    .sort((a, b) => a.position - b.position)[0];
  return image ? (
    <img
      src={image.url}
      alt={local(product.name)}
      loading="lazy"
      width="480"
      height="360"
    />
  ) : (
    <div className="photo-empty">
      <ImageOff size={30} />
      <span>{t("noPhoto")}</span>
    </div>
  );
}
export function ProductCard({ product: p }: { product: Product }) {
  const { local, t, money } = useI18n();
  const { add, favorites, toggleFavorite } = useStore();
  return (
    <article className="product-card">
      <div className="product-visual">
        <Link to={"/product/" + p.slug}>
          <ProductPhoto product={p} />
        </Link>
        <span className="badge">
          {isDemo ? t("demoShort") : p.capacity + " " + t("eggs")}
        </span>
        <button
          className={
            "icon favorite " + (favorites.includes(p.id) ? "selected" : "")
          }
          aria-label={t("favorites") + " " + local(p.name)}
          aria-pressed={favorites.includes(p.id)}
          onClick={() => void toggleFavorite(p.id)}
        >
          <Heart size={19} />
        </button>
      </div>
      <div className="product-body">
        <span className={"availability " + (!p.stock ? "muted" : "")}>
          {t(p.stock ? "stock" : "outOfStock")}
        </span>
        <Link to={"/product/" + p.slug}>
          <h3>
            {local(p.name)} <ArrowUpRight size={17} />
          </h3>
        </Link>
        <p className="muted">
          {p.capacity} {t("eggs")}
        </p>
        <div className="product-bottom">
          <div>
            {p.old_price_minor && <del>{money(p.old_price_minor)}</del>}
            <strong>{money(p.price_minor)}</strong>
          </div>
          <button
            className="icon buy-small"
            aria-label={t("add") + " " + local(p.name)}
            disabled={!p.stock}
            onClick={() => add(p)}
          >
            <ShoppingBag size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
