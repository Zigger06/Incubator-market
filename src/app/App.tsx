import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import Home from "../pages/Home";
import { WebMCP } from "./WebMCP";
import { useI18n } from "../i18n/Provider";
const Catalog = lazy(() => import("../pages/Catalog"));
const Product = lazy(() => import("../pages/Product"));
const Cart = lazy(() => import("../pages/Cart"));
const Auth = lazy(() => import("../pages/Auth"));
const Checkout = lazy(() => import("../pages/Checkout"));
const Account = lazy(() => import("../pages/Account"));
const Admin = lazy(() => import("../pages/Admin"));
const Contact = lazy(() => import("../pages/Contact"));
const Information = lazy(() => import("../pages/Information"));
export default function App() {
  const { t } = useI18n();
  return (
    <>
      <WebMCP />
      <Suspense fallback={<div className="status">{t("loading")}</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="catalog" element={<Catalog />} />
            <Route
              path="products"
              element={<Navigate to="/catalog" replace />}
            />
            <Route path="product/:slug" element={<Product />} />
            <Route path="favorites" element={<Catalog favoritesOnly />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="auth" element={<Auth />} />
            <Route path="account" element={<Account />} />
            <Route path="admin" element={<Admin />} />
            <Route path="contact" element={<Contact />} />
            {["about", "delivery", "warranty", "faq", "categories"].map((p) => (
              <Route path={p} key={p} element={<Information kind={p} />} />
            ))}
            <Route path="*" element={<Information />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
