import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Grid2X2, List, Heart } from "lucide-react";
import { useI18n } from "../i18n/Provider";
import { useStore } from "../app/StoreProvider";
import { featureLabels } from "../config/site";
import { ProductCard } from "../components/ProductCard";
import { CatalogStatus } from "../components/Status";
export default function Catalog({
  favoritesOnly = false,
}: {
  favoritesOnly?: boolean;
}) {
  const { t, local, locale } = useI18n();
  const { products, categories, favorites, loading, error } = useStore();
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(12);
  const [list, setList] = useState(false);
  const [filters, setFilters] = useState(false);
  const value = (k: string) => params.get(k) || "";
  function set(k: string, v: string) {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
    setLimit(12);
  }
  const capacities = [...new Set(products.map((p) => p.capacity))].sort(
    (a, b) => a - b,
  );
  const types = [...new Set(products.map((p) => p.type))];
  const rows = products
    .filter(
      (p) =>
        (!favoritesOnly || favorites.includes(p.id)) &&
        (!value("q") ||
          (local(p.name) + " " + local(p.description) + " " + p.capacity)
            .toLowerCase()
            .includes(value("q").toLowerCase())) &&
        (!value("category") || p.category_id === value("category")) &&
        (!value("capacity") || p.capacity === Number(value("capacity"))) &&
        (!value("min") || p.price_minor >= Number(value("min")) * 100) &&
        (!value("max") || p.price_minor <= Number(value("max")) * 100) &&
        (!value("stock") || p.stock > 0) &&
        (!value("type") || p.type === value("type")) &&
        (!value("feature") || p.features.includes(value("feature"))),
    )
    .sort((a, b) =>
      value("sort") === "asc"
        ? a.price_minor - b.price_minor
        : value("sort") === "desc"
          ? b.price_minor - a.price_minor
          : Number(b.featured) - Number(a.featured),
    );
  if (favoritesOnly && !loading && !error && favorites.length === 0)
    return (
      <div className="page">
        <div className="page-title">
          <h1>{t("favorites")}</h1>
        </div>
        <div className="empty empty-state">
          <Heart size={42} />
          <h2>{t("emptyFavorites")}</h2>
          <p>{t("emptyFavoritesHint")}</p>
          <Link className="button primary" to="/catalog">
            {t("continue")}
          </Link>
        </div>
      </div>
    );
  const countLabel =
    locale === "ru" ? new Intl.PluralRules("ru").select(rows.length) : "other";
  return (
    <div className="page">
      <div className="page-title">
        <span className="eyebrow">INCUBATOR MARKET / {t("catalog")}</span>
        <h1>{t(favoritesOnly ? "favorites" : "catalog")}</h1>
      </div>
      <div className="catalog-search">
        <Search size={21} />
        <input
          aria-label={t("searchLabel")}
          value={value("q")}
          placeholder={t("search")}
          onChange={(e) => set("q", e.target.value)}
        />
        <button
          className="icon filter-toggle"
          aria-expanded={filters}
          aria-controls="catalog-filters"
          aria-label={t("filters")}
          onClick={() => setFilters(!filters)}
        >
          <SlidersHorizontal />
        </button>
      </div>
      <div className="catalog-layout">
        <aside
          id="catalog-filters"
          className={"filters " + (filters ? "expanded" : "")}
        >
          <div className="section-heading">
            <h3>{t("filters")}</h3>
            <button
              className="text-button"
              onClick={() => {
                setParams({});
                setLimit(12);
              }}
            >
              {t("reset")}
            </button>
          </div>
          <label>
            {t("category")}
            <select
              value={value("category")}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">{t("all")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {local(c.name)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("capacity")}
            <select
              value={value("capacity")}
              onChange={(e) => set("capacity", e.target.value)}
            >
              <option value="">{t("all")}</option>
              {capacities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>{t("price")} · TJS</legend>
            <div className="two-fields">
              <input
                type="number"
                min="0"
                aria-label={t("minimum")}
                placeholder={t("minimum")}
                value={value("min")}
                onChange={(e) => set("min", e.target.value)}
              />
              <input
                type="number"
                min="0"
                aria-label={t("maximum")}
                placeholder={t("maximum")}
                value={value("max")}
                onChange={(e) => set("max", e.target.value)}
              />
            </div>
          </fieldset>
          <label>
            {t("type")}
            <select
              value={value("type")}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="">{t("all")}</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {local(
                    categories.find((c) => c.slug === type)?.name || {
                      tj: type,
                      ru: type,
                    },
                  )}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("features")}
            <select
              value={value("feature")}
              onChange={(e) => set("feature", e.target.value)}
            >
              <option value="">{t("all")}</option>
              {Object.entries(featureLabels).map(([k, l]) => (
                <option key={k} value={k}>
                  {local(l)}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={!!value("stock")}
              onChange={(e) => set("stock", e.target.checked ? "1" : "")}
            />
            {t("stock")}
          </label>
        </aside>
        <div>
          <div className="catalog-toolbar">
            <span>
              {rows.length}{" "}
              {t(
                countLabel === "one"
                  ? "resultOne"
                  : countLabel === "few"
                    ? "resultFew"
                    : "results",
              )}
            </span>
            <div className="actions">
              <select
                aria-label={t("sort")}
                value={value("sort")}
                onChange={(e) => set("sort", e.target.value)}
              >
                <option value="">{t("popular")}</option>
                <option value="asc">{t("priceAsc")}</option>
                <option value="desc">{t("priceDesc")}</option>
              </select>
              <button
                className="icon"
                aria-label={t(list ? "grid" : "list")}
                onClick={() => setList(!list)}
              >
                {list ? <Grid2X2 size={19} /> : <List size={19} />}
              </button>
            </div>
          </div>
          <CatalogStatus />
          {!loading && !error && !rows.length && (
            <div className="empty empty-state">
              <Search size={40} />
              <h2>
                {t(favoritesOnly ? "emptyFavoritesFiltered" : "emptyResults")}
              </h2>
              <p>{t("emptyHint")}</p>
              <button
                className="button secondary"
                onClick={() => setParams({})}
              >
                {t("reset")}
              </button>
            </div>
          )}
          <div
            className={
              "product-grid catalog-products " +
              (list
                ? "list-view"
                : rows.length === 1
                  ? "single-result"
                  : rows.length === 2
                    ? "sparse-results"
                    : "")
            }
          >
            {rows.slice(0, limit).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {!loading && !error && rows.length > 0 && rows.length <= 2 && (
            <aside className="catalog-help">
              <h2>{t("support")}</h2>
              <p>{t("supportText")}</p>
              <Link className="text-link" to="/contact">
                {t("consult")}
              </Link>
            </aside>
          )}
          {rows.length > limit && (
            <button
              className="button secondary load-more"
              onClick={() => setLimit(limit + 12)}
            >
              {t("more")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
