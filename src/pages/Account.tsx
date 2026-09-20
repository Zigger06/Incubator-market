import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { useI18n } from "../i18n/Provider";
import { requireBackend } from "../lib/supabase";
import { listOrders } from "../services/orders";
import type { Order, UserProfile } from "../types";
import { Notice } from "../components/Status";
export default function Account() {
  const { user, loading, isAdmin, logout } = useAuth();
  const { t, money, local } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(true);
  useEffect(() => {
    let active = true;
    if (user)
      Promise.all([
        listOrders(),
        requireBackend()
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single(),
      ])
        .then(([o, p]) => {
          if (p.error) throw p.error;
          if (active) {
            setOrders(o);
            setProfile(p.data);
          }
        })
        .catch(() => {
          if (active) {
            setError(true);
            setMessage(t("genericError"));
          }
        })
        .finally(() => {
          if (active) setPending(false);
        });
    return () => {
      active = false;
    };
  }, [user, t]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const form = new FormData(e.currentTarget);
      const { error } = await requireBackend()
        .from("profiles")
        .update({
          name: String(form.get("name")).trim(),
          address: String(form.get("address")).trim(),
        })
        .eq("id", user!.id);
      if (error) throw error;
      setMessage(t("saved"));
    } catch {
      setError(true);
      setMessage(t("genericError"));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <div className="status">{t("loading")}</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <div className="page">
      <div className="section-heading">
        <h1>{t("account")}</h1>
        <div className="actions">
          {isAdmin && (
            <Link className="button secondary" to="/admin">
              {t("admin")}
            </Link>
          )}
          <button
            onClick={() =>
              void logout().catch(() => {
                setError(true);
                setMessage(t("genericError"));
              })
            }
          >
            {t("logout")}
          </button>
        </div>
      </div>
      <Notice text={message} error={error} />
      <div className="account-grid">
        <form className="panel" onSubmit={save}>
          <h2>{t("profile")}</h2>
          <p>{user.phone}</p>
          {profile && (
            <>
              <label>
                {t("name")}
                <input
                  name="name"
                  defaultValue={profile.name}
                  maxLength={100}
                />
              </label>
              <label>
                {t("address")}
                <textarea
                  name="address"
                  defaultValue={profile.address}
                  maxLength={300}
                />
              </label>
              <button className="button primary" disabled={busy}>
                {t("save")}
              </button>
            </>
          )}
          <Link className="text-link" to="/favorites">
            {t("favorites")}
          </Link>
        </form>
        <section>
          <h2>{t("orders")}</h2>
          {pending ? (
            <p>{t("loading")}</p>
          ) : !orders.length && !error ? (
            <p>{t("noOrders")}</p>
          ) : (
            orders.map((o) => (
              <details className="order" key={o.id}>
                <summary>
                  <strong>#{o.number}</strong>
                  <span>{new Date(o.created_at).toLocaleDateString()}</span>
                  <span className="tag">{t(o.status)}</span>
                  <strong>{money(o.total_minor)}</strong>
                </summary>
                <div>
                  {o.order_items.map((i) => (
                    <p key={i.id}>
                      {local(i.name)}
                      {i.variant_name
                        ? " / " + local(i.variant_name)
                        : ""} × {i.quantity} —{" "}
                      {money(i.unit_price_minor * i.quantity)}
                    </p>
                  ))}
                  <p>
                    {o.city}, {o.address}
                  </p>
                  <p>{t("paymentNote")}</p>
                </div>
              </details>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
