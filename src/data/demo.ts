import type { Category, Product } from "../types";
export const demoCategories: Category[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "home",
    name: { tj: "Барои хона", ru: "Для дома" },
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    slug: "farm",
    name: { tj: "Барои хоҷагӣ", ru: "Для хозяйства" },
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    slug: "professional",
    name: { tj: "Касбӣ", ru: "Профессиональные" },
  },
];
export const demoProducts: Product[] = [
  30, 64, 128, 200, 256, 300, 320, 400, 500,
].map((capacity, i) => ({
  id: `20000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  slug: `incubator-${capacity}`,
  name: { tj: `Инкубатор ${capacity}`, ru: `Инкубатор ${capacity}` },
  description: {
    tj: "Модели намунавӣ барои шиносоӣ бо каталог. Хусусиятҳо, нарх ва аксро фурӯшанда пеш аз фурӯш тасдиқ мекунад.",
    ru: "Пример модели для знакомства с каталогом. Характеристики, цену и фото продавец подтверждает перед продажей.",
  },
  category_id: demoCategories[i < 2 ? 0 : i < 6 ? 1 : 2].id,
  price_minor: [
    65000, 95000, 145000, 215000, 265000, 310000, 345000, 420000, 490000,
  ][i],
  old_price_minor: null,
  capacity,
  stock: i === 7 ? 0 : 5,
  type: i < 2 ? "home" : i < 6 ? "farm" : "professional",
  features: ["auto_turn", ...(i > 5 ? ["humidity", "backup"] : [])],
  specs: {},
  published: true,
  featured: i < 4,
  product_images: [],
  product_variants: [],
}));
