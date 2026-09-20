import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useStore } from "../app/StoreProvider";
import { useAuth } from "../features/auth/AuthProvider";
import { useI18n } from "../i18n/Provider";
import { checkoutSchema } from "../lib/validation";
import { createOrder } from "../services/orders";
import { cartTotal, resolveCart } from "../features/cart/model";
import { loadCartProducts } from "../services/catalog";
import { isDemo } from "../lib/supabase";
import { Notice, CatalogStatus } from "../components/Status";
import { ContactLinks } from "../components/ContactLinks";
import type { MessageKey } from "../i18n/messages";
export default function Checkout() {
  const {
    cart,
    setCart,
    products,
    reload,
    loading,
    error: loadError,
  } = useStore();
  const { user } = useAuth();
  const { t, money, local } = useI18n();
  const requestId = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id: string; number: number } | null>(
    null,
  );
  const [delivery, setDelivery] = useState("delivery");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const input = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const fresh = await loadCartProducts(cart.map((i) => i.product_id));
      const rows = resolveCart(cart, fresh);
      if (
        rows.some((r) => !r.valid || r.stock < r.item.quantity) ||
        cartTotal(cart, fresh) !== cartTotal(cart, products)
      ) {
        await reload();
        throw new Error("stockChanged");
      }
      const order = await createOrder(
        parsed.data,
        cart,
        requestId.current,
        cartTotal(cart, fresh),
      );
      setSuccess(order);
      setCart([]);
      void reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "genericError");
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="empty">
        <CheckCircle2 size={48} />
        <h1>{t("orderSuccess")}</h1>
        <h2>
          {t("orderNumber")} #{success.number}
        </h2>
        <p>{t("orderNext")}</p>
        <Link className="button primary" to="/account">
          {t("orders")}
        </Link>
      </div>
    );
  if (loading || loadError) return <CatalogStatus />;
  if (!cart.length)
    return (
      <div className="empty">
        <h1>{t("emptyCart")}</h1>
        <Link to="/catalog">{t("continue")}</Link>
      </div>
    );
  if (!user)
    return (
      <div className="empty">
        <h1>{t("checkout")}</h1>
        <p>{t("loginCheckout")}</p>
        <Link className="button primary" to="/auth?next=/checkout">
          {t("login")}
        </Link>
        <ContactLinks />
      </div>
    );
  return (
    <div className="page">
      <h1>{t("checkout")}</h1>
      <div className="checkout-layout">
        <form className="panel" onSubmit={submit}>
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
                defaultValue={
                  user.phone ? "+" + user.phone.replace(/^\+/, "") : ""
                }
                required
              />
            </label>
          </div>
          <label>
            {t("city")}
            <input
              name="city"
              autoComplete="address-level2"
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            {t("deliveryMethod")}
            <select
              name="delivery"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
            >
              <option value="delivery">{t("courier")}</option>
              <option value="pickup">{t("pickup")}</option>
            </select>
          </label>
          <label>
            {t("address")}
            <input
              name="address"
              autoComplete="street-address"
              required={delivery === "delivery"}
              maxLength={300}
            />
          </label>
          <label>
            {t("comment")}
            <textarea name="comment" maxLength={1000} />
          </label>
          <p className="muted">{t("privacyNote")}</p>
          <Notice
            error
            text={
              error
                ? t(
                    (["stockChanged", "unavailable", "required"].includes(error)
                      ? error
                      : "genericError") as MessageKey,
                  )
                : ""
            }
          />
          <button className="button primary full" disabled={busy || isDemo}>
            {t(busy ? "loading" : "checkout")}
          </button>
        </form>
        <aside className="summary">
          <h2>{t("total")}</h2>
          {resolveCart(cart, products).map(({ item, product, price }) => (
            <div
              className="summary-line"
              key={item.product_id + item.variant_id}
            >
              <span>
                {product ? local(product.name) : t("outOfStock")} ×{" "}
                {item.quantity}
              </span>
              <strong>{money(price * item.quantity)}</strong>
            </div>
          ))}
          <hr />
          <strong className="total-price">
            {money(cartTotal(cart, products))}
          </strong>
          <p>{t("paymentNote")}</p>
          <ContactLinks />
        </aside>
      </div>
    </div>
  );
}
