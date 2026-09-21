import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { useStore } from "../app/StoreProvider";
import { useI18n } from "../i18n/Provider";
import {
  adminCatalog,
  adminCategories,
  adminOrders,
  adminMessages,
  adminProfiles,
  saveCategory,
  deleteRecord,
  updateStatus,
} from "../services/admin";
import { ProductEditor, ImageManager } from "../features/admin/ProductEditor";
import { SettingsEditor } from "../features/admin/SettingsEditor";
import type {
  Product,
  Category,
  Order,
  ContactMessage,
  UserProfile,
  OrderStatus,
} from "../types";
import { orderStatuses } from "../types";
import { Notice } from "../components/Status";
import type { MessageKey } from "../i18n/messages";
type Tab =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "users"
  | "messages"
  | "settings";
export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const { reload, settings } = useStore();
  const { t, local, money } = useI18n();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => {
    const [p, c, o, m, u] = await Promise.all([
      adminCatalog(),
      adminCategories(),
      adminOrders(),
      adminMessages(),
      adminProfiles(),
    ]);
    setProducts(p);
    setCategories(c);
    setOrders(o.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    setMessages(m);
    setUsers(u);
    setReady(true);
    await reload();
  }, [reload]);
  useEffect(() => {
    if (isAdmin) void refresh().catch(() => setError(true));
  }, [isAdmin, refresh]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError(false);
    try {
      await fn();
      await refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function categorySave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await action(() =>
      saveCategory({
        id: category?.id || crypto.randomUUID(),
        slug: String(f.get("slug")),
        name: { tj: String(f.get("tj")), ru: String(f.get("ru")) },
      }),
    );
    setCategory(null);
  }
  if (loading) return <div className="status">{t("loading")}</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin)
    return (
      <div className="empty">
        <h1>{t("forbidden")}</h1>
        <Link to="/account">{t("account")}</Link>
      </div>
    );
  return (
    <div className="page admin">
      <h1>{t("admin")}</h1>
      <nav className="admin-tabs">
        {(
          [
            "dashboard",
            "products",
            "categories",
            "orders",
            "users",
            "messages",
            "settings",
          ] as Tab[]
        ).map((k) => (
          <button
            key={k}
            aria-pressed={tab === k}
            onClick={() => {
              setTab(k);
              setEditor(null);
            }}
          >
            {t(k)}
          </button>
        ))}
      </nav>
      <Notice text={error ? t("genericError") : ""} error />
      {!ready && !error && <p>{t("loading")}</p>}
      {tab === "dashboard" && (
        <div className="stats">
          {[
            ["products", products.length],
            ["orders", orders.length],
            ["messages", messages.length],
          ].map(([k, n]) => (
            <div className="panel" key={k}>
              <strong>{n}</strong>
              <span>{t(k as MessageKey)}</span>
            </div>
          ))}
        </div>
      )}
      {tab === "products" &&
        (editor ? (
          <ProductEditor
            key={editor === "new" ? "new" : editor.id}
            product={editor === "new" ? undefined : editor}
            categories={categories}
            onSaved={refresh}
            onCancel={() => setEditor(null)}
          />
        ) : (
          <>
            <button className="button primary" onClick={() => setEditor("new")}>
              {t("newProduct")}
            </button>
            {products.map((p) => (
              <div className="admin-record" key={p.id}>
                <div className="section-heading">
                  <div>
                    <h3>{local(p.name)}</h3>
                    <span>
                      {money(p.price_minor)} · {t("stock")}: {p.stock} ·{" "}
                      {p.published ? t("published") : "—"}
                    </span>
                  </div>
                  <div className="actions">
                    <button onClick={() => setEditor(p)}>{t("edit")}</button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(t("deleteConfirm")))
                          void action(() => deleteRecord("products", p.id));
                      }}
                    >
                      {t("remove")}
                    </button>
                  </div>
                </div>
                <ImageManager product={p} onSaved={refresh} />
              </div>
            ))}
          </>
        ))}
      {tab === "categories" && (
        <>
          <form
            className="panel"
            key={category?.id || "new"}
            onSubmit={categorySave}
          >
            <div className="two-fields">
              <label>
                {t("name")} · TJ
                <input
                  name="tj"
                  defaultValue={category?.name.tj}
                  required
                  maxLength={100}
                />
              </label>
              <label>
                {t("name")} · RU
                <input
                  name="ru"
                  defaultValue={category?.name.ru}
                  required
                  maxLength={100}
                />
              </label>
            </div>
            <label>
              {t("slug")}
              <input
                name="slug"
                defaultValue={category?.slug}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                maxLength={100}
              />
            </label>
            <button disabled={busy}>{t("save")}</button>
            {category && (
              <button type="button" onClick={() => setCategory(null)}>
                {t("cancel")}
              </button>
            )}
          </form>
          {categories.map((c) => (
            <div className="admin-record section-heading" key={c.id}>
              <strong>{local(c.name)}</strong>
              <div className="actions">
                <button onClick={() => setCategory(c)}>{t("edit")}</button>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t("deleteConfirm")))
                      void action(() => deleteRecord("categories", c.id));
                  }}
                >
                  {t("remove")}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
      {tab === "orders" &&
        orders.map((o) => (
          <div className="admin-record" key={o.id}>
            <div className="section-heading">
              <h3>
                #{o.number} · {money(o.total_minor)}
              </h3>
              <select
                aria-label={t("status") + " #" + o.number}
                value={o.status}
                disabled={
                  busy || o.status === "cancelled" || o.status === "delivered"
                }
                onChange={(e) =>
                  void action(() =>
                    updateStatus(o.id, e.target.value as OrderStatus),
                  )
                }
              >
                {orderStatuses.map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </div>
            <p>
              {o.name} · {o.phone}
            </p>
            <p>
              {o.city} · {o.address} ·{" "}
              {o.delivery === "pickup" ? t("pickup") : t("courier")}
            </p>
            <p>{o.comment}</p>
            {o.order_items.map((i) => (
              <p key={i.id}>
                {local(i.name)}
                {i.variant_name ? " / " + local(i.variant_name) : ""} ×{" "}
                {i.quantity} · {money(i.unit_price_minor)}
              </p>
            ))}
          </div>
        ))}
      {tab === "messages" &&
        messages.map((m) => (
          <article className="admin-record" key={m.id}>
            <h3>{m.subject}</h3>
            <p>
              {m.name} · {m.phone}
            </p>
            <p>
              {t("preferredChannel")}:{" "}
              {m.preferred_channel === "telegram"
                ? `Telegram · @${m.telegram_username}`
                : m.preferred_channel === "whatsapp"
                  ? "WhatsApp"
                  : t("phoneCall")}
            </p>
            <p className="prewrap">{m.message}</p>
          </article>
        ))}
      {tab === "users" &&
        users.map((u) => (
          <article className="admin-record" key={u.id}>
            <h3>{u.name || "—"}</h3>
            <p>{u.phone}</p>
            <p>{u.address}</p>
          </article>
        ))}
      {tab === "settings" && (
        <SettingsEditor settings={settings} onSaved={reload} />
      )}
    </div>
  );
}
