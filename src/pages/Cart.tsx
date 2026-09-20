import { Link } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useStore } from "../app/StoreProvider";
import { useI18n } from "../i18n/Provider";
import { cartKey, resolveCart, cartTotal } from "../features/cart/model";
import { ProductPhoto } from "../components/ProductCard";
import { CatalogStatus } from "../components/Status";
export default function Cart() {
  const { cart, setCart, products, loading, error } = useStore();
  const { t, local, money } = useI18n();
  if (loading || error) return <CatalogStatus />;
  if (!cart.length)
    return (
      <div className="empty">
        <ShoppingBag size={42} />
        <h1>{t("emptyCart")}</h1>
        <Link className="button primary" to="/catalog">
          {t("continue")}
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  return (
    <div className="page">
      <h1>{t("cart")}</h1>
      <div className="checkout-layout">
        <div>
          {resolveCart(cart, products).map(
            ({ item, product, variant, price, stock }) => (
              <article className="cart-row" key={cartKey(item)}>
                <div className="cart-photo">
                  {product && <ProductPhoto product={product} />}
                </div>
                <div>
                  <Link to={product ? "/product/" + product.slug : "/catalog"}>
                    <h3>{product ? local(product.name) : t("outOfStock")}</h3>
                  </Link>
                  {variant && <p>{local(variant.name)}</p>}
                  <strong>{money(price)}</strong>
                  {item.quantity > stock && (
                    <p className="error-text">{t("stockChanged")}</p>
                  )}
                </div>
                <label>
                  {t("quantity")}
                  <input
                    aria-label={
                      t("quantity") + (product ? " " + local(product.name) : "")
                    }
                    type="number"
                    min="1"
                    max={Math.min(99, stock)}
                    value={item.quantity}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      if (Number.isInteger(q) && q > 0 && q <= 99)
                        setCart(
                          cart.map((i) =>
                            cartKey(i) === cartKey(item)
                              ? { ...i, quantity: q }
                              : i,
                          ),
                        );
                    }}
                  />
                </label>
                <button
                  className="icon"
                  aria-label={t("remove")}
                  onClick={() =>
                    setCart(cart.filter((i) => cartKey(i) !== cartKey(item)))
                  }
                >
                  <Trash2 size={20} />
                </button>
              </article>
            ),
          )}
        </div>
        <aside className="summary">
          <h2>{t("total")}</h2>
          <div className="summary-line">
            <span>{t("subtotal")}</span>
            <strong>{money(cartTotal(cart, products))}</strong>
          </div>
          <p>{t("paymentNote")}</p>
          <Link to="/checkout" className="button primary full">
            {t("checkout")}
            <ArrowRight size={19} />
          </Link>
          <Link to="/catalog" className="text-link">
            {t("continue")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
