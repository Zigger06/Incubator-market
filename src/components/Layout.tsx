import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Egg,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Sun,
  Moon,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { useI18n } from "../i18n/Provider";
import { useStore } from "../app/StoreProvider";
import { isDemo } from "../lib/supabase";
import { readLocal, writeLocal } from "../lib/storage";
import type { MessageKey } from "../i18n/messages";
import { ContactWidget } from "../features/contact/ContactWidget";
export function Layout() {
  const { t, locale, setLocale, local } = useI18n();
  const { settings, cart, notice } = useStore();
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(() => readLocal("im:dark", false));
  const [offline, setOffline] = useState(!navigator.onLine);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
    document.title = settings.name + " — " + t("catalog");
  }, [location.pathname, settings.name, t]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    writeLocal("im:dark", dark);
  }, [dark]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const links: [string, MessageKey][] = [
    ["/", "home"],
    ["/catalog", "catalog"],
    ["/about", "about"],
    ["/delivery", "delivery"],
    ["/warranty", "warranty"],
    ["/contact", "contact"],
  ];
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        {t("skipContent")}
      </a>
      <div className="topbar">
        <div className="container">
          <span>
            <MapPin size={14} /> Тоҷикистон · Душанбе
          </span>
          <span>
            {settings.hours} <span className="top-separator"> / </span>
            {t("support")}
          </span>
        </div>
      </div>
      <header>
        <div className="container header-main">
          <Link to="/" className="brand">
            <span className="brand-icon">
              <Egg size={28} />
            </span>
            <span>
              INCUBATOR<small>MARKET / TJ</small>
            </span>
          </Link>
          <div className="header-actions">
            <button
              className="language"
              onClick={() => setLocale(locale === "tj" ? "ru" : "tj")}
              aria-label="Тоҷикӣ / Русский"
            >
              {locale === "tj" ? "TJ" : "RU"} <span>⌄</span>
            </button>
            <button
              className="icon theme-button"
              onClick={() => setDark(!dark)}
              aria-label={t(dark ? "light" : "dark")}
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link className="icon" to="/favorites" aria-label={t("favorites")}>
              <Heart size={21} />
            </Link>
            <Link className="icon" to="/account" aria-label={t("account")}>
              <User size={21} />
            </Link>
            <Link className="cart-link" to="/cart">
              <ShoppingBag size={20} />
              <span>{t("cart")}</span>
              <b>{cart.reduce((n, i) => n + i.quantity, 0)}</b>
            </Link>
            <button
              className="icon mobile-menu"
              aria-label={t("menu")}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <nav
          className={"container navigation " + (menu ? "open" : "")}
          aria-label={t("menu")}
        >
          {links.map(([path, label]) => (
            <NavLink end key={path} to={path}>
              {t(label)}
            </NavLink>
          ))}
          <div className="mobile-nav-extra">
            <Link to="/account">{t("account")}</Link>
            <Link to="/favorites">{t("favorites")}</Link>
            <button onClick={() => setDark(!dark)}>
              {t(dark ? "light" : "dark")}
            </button>
          </div>
          <Link className="nav-consult" to="/contact">
            {t("consult")} <ArrowUpRight size={17} />
          </Link>
        </nav>
      </header>
      {isDemo && <div className="demo-strip">{t("demo")}</div>}
      {offline && (
        <div className="alert error" role="status">
          {t("offline")}
        </div>
      )}
      <main id="main" className="container" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <div className="container footer-grid">
          <div>
            <Link to="/" className="brand">
              <span className="brand-icon">
                <Egg size={27} />
              </span>
              <span>
                INCUBATOR<small>MARKET / TJ</small>
              </span>
            </Link>
            <p>{t("footerText")}</p>
          </div>
          <div>
            <strong>{t("catalog")}</strong>
            {[
              ["/catalog", "catalog"],
              ["/categories", "categories"],
              ["/favorites", "favorites"],
            ].map(([p, k]) => (
              <Link key={p} to={p}>
                {t(k as MessageKey)}
              </Link>
            ))}
          </div>
          <div>
            <strong>{t("support")}</strong>
            {[
              ["/about", "about"],
              ["/delivery", "delivery"],
              ["/warranty", "warranty"],
              ["/faq", "faq"],
              ["/contact", "contact"],
            ].map(([p, k]) => (
              <Link key={p} to={p}>
                {t(k as MessageKey)}
              </Link>
            ))}
          </div>
          <div>
            <strong>{t("contact")}</strong>
            <p>{local(settings.address)}</p>
            <p>{settings.hours}</p>
            {settings.phone && (
              <a href={"tel:" + settings.phone}>{settings.phone}</a>
            )}
          </div>
        </div>
        <div className="container footer-bottom">
          © {new Date().getFullYear()} {settings.name}
          <span>Тоҷикистон</span>
        </div>
      </footer>
      <ContactWidget />
      {notice && (
        <div className="toast" role="status">
          {t(notice as MessageKey)}
        </div>
      )}
    </>
  );
}
