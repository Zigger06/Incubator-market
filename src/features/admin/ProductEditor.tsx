import { useState, type FormEvent } from "react";
import type { Category, Product, ProductVariant } from "../../types";
import { useI18n } from "../../i18n/Provider";
import { saveProduct, uploadImage, deleteImage } from "../../services/admin";
import { featureLabels } from "../../config/site";
import { Notice } from "../../components/Status";
const emptyProduct = (): Product => ({
  id: crypto.randomUUID(),
  slug: "",
  name: { tj: "", ru: "" },
  description: { tj: "", ru: "" },
  category_id: "",
  price_minor: 0,
  old_price_minor: null,
  capacity: 30,
  stock: 0,
  type: "home",
  features: [],
  specs: {},
  published: false,
  featured: false,
  product_images: [],
  product_variants: [],
});
export function ProductEditor({
  product,
  categories,
  onSaved,
  onCancel,
}: {
  product?: Product;
  categories: Category[];
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const { t, local } = useI18n();
  const [p] = useState(product || emptyProduct);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const s = (k: string) => String(f.get(k) || "").trim();
      const number = (k: string) => Number(s(k));
      const specs = Object.fromEntries(
        s("specs")
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const i = line.indexOf(":");
            if (i < 1) throw new Error();
            return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
          }),
      );
      const variants: ProductVariant[] = s("variants")
        .split("\n")
        .filter(Boolean)
        .map((line, i) => {
          const [tj, ru, price, stock] = line.split("|").map((v) => v.trim());
          if (
            !tj ||
            !ru ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
          )
            throw new Error();
          return {
            id:
              p.product_variants.filter((v) => v.active)[i]?.id ||
              crypto.randomUUID(),
            product_id: p.id,
            name: { tj, ru },
            price_minor: Math.round(Number(price) * 100),
            stock: Number(stock),
            active: true,
          };
        });
      const data = {
        id: p.id,
        slug: s("slug"),
        name: { tj: s("name_tj"), ru: s("name_ru") },
        description: { tj: s("description_tj"), ru: s("description_ru") },
        category_id: s("category_id"),
        price_minor: Math.round(number("price") * 100),
        old_price_minor: s("oldPrice")
          ? Math.round(number("oldPrice") * 100)
          : null,
        capacity: number("capacity"),
        stock: number("stock"),
        type: s("type"),
        features: f.getAll("features").map(String),
        specs,
        published: f.has("published"),
        featured: f.has("featured"),
      };
      await saveProduct(data, variants);
      await onSaved();
      onCancel();
    } catch {
      setError(t("required") + " " + t("genericError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel product-editor" onSubmit={submit}>
      <div className="section-heading">
        <h2>{t(product ? "edit" : "newProduct")}</h2>
        <button type="button" onClick={onCancel}>
          {t("cancel")}
        </button>
      </div>
      <div className="two-fields">
        {(["tj", "ru"] as const).map((l) => (
          <label key={l}>
            {t("name")} · {l.toUpperCase()}
            <input
              name={"name_" + l}
              defaultValue={p.name[l]}
              required
              maxLength={200}
            />
          </label>
        ))}
      </div>
      <label>
        {t("slug")}
        <input
          name="slug"
          defaultValue={p.slug}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          maxLength={100}
        />
      </label>
      <div className="two-fields">
        {(["tj", "ru"] as const).map((l) => (
          <label key={l}>
            {t("description")} · {l.toUpperCase()}
            <textarea
              name={"description_" + l}
              defaultValue={p.description[l]}
              required
              maxLength={6000}
            />
          </label>
        ))}
      </div>
      <div className="two-fields">
        <label>
          {t("category")}
          <select
            name="category_id"
            defaultValue={p.category_id || categories[0]?.id}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {local(c.name)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("type")}
          <input name="type" defaultValue={p.type} required maxLength={50} />
        </label>
      </div>
      <div className="two-fields">
        <label>
          {t("price")} · TJS
          <input
            name="price"
            type="number"
            defaultValue={p.price_minor / 100}
            min="0"
            max="10000000"
            step="0.01"
            required
          />
        </label>
        <label>
          {t("oldPrice")} · TJS
          <input
            name="oldPrice"
            type="number"
            defaultValue={p.old_price_minor ? p.old_price_minor / 100 : ""}
            min="0"
            max="10000000"
            step="0.01"
          />
        </label>
        <label>
          {t("capacity")}
          <input
            name="capacity"
            type="number"
            min="1"
            max="100000"
            defaultValue={p.capacity}
            required
          />
        </label>
        <label>
          {t("stock")}
          <input
            name="stock"
            type="number"
            min="0"
            max="100000"
            defaultValue={p.stock}
            required
          />
        </label>
      </div>
      <div className="actions">
        {Object.entries(featureLabels).map(([k, l]) => (
          <label className="checkbox" key={k}>
            <input
              type="checkbox"
              name="features"
              value={k}
              defaultChecked={p.features.includes(k)}
            />
            {local(l)}
          </label>
        ))}
      </div>
      <label>
        {t("specsHelp")}
        <textarea
          name="specs"
          defaultValue={Object.entries(p.specs)
            .map(([k, v]) => k + ": " + v)
            .join("\n")}
        />
      </label>
      <label>
        {t("variantsHelp")}
        <textarea
          name="variants"
          defaultValue={p.product_variants
            .filter((v) => v.active)
            .map(
              (v) =>
                `${v.name.tj} | ${v.name.ru} | ${v.price_minor / 100} | ${v.stock}`,
            )
            .join("\n")}
        />
      </label>
      <div className="actions">
        <label className="checkbox">
          <input
            name="published"
            type="checkbox"
            defaultChecked={p.published}
          />
          {t("published")}
        </label>
        <label className="checkbox">
          <input name="featured" type="checkbox" defaultChecked={p.featured} />
          {t("featuredFlag")}
        </label>
      </div>
      <Notice text={error} error />
      <button className="button primary" disabled={busy}>
        {t(busy ? "loading" : "save")}
      </button>
    </form>
  );
}
export function ImageManager({
  product,
  onSaved,
}: {
  product: Product;
  onSaved: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await onSaved();
    } catch {
      setError(t("genericError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details>
      <summary>{t("images")}</summary>
      <p>{t("photoLimit")}</p>
      <div className="thumbnails">
        {product.product_images.map((image) => (
          <div key={image.id}>
            <img src={image.url} alt="" />
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm(t("deleteConfirm")))
                  void run(() => deleteImage(image.id, image.storage_path));
              }}
            >
              {t("remove")}
            </button>
          </div>
        ))}
      </div>
      <label>
        {t("upload")}
        <input
          disabled={busy}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void run(() => uploadImage(product.id, file));
            e.target.value = "";
          }}
        />
      </label>
      <Notice text={error} error />
    </details>
  );
}
