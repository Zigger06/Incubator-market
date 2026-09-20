import type { CartItem, Product } from "../../types";
export const cartKey = (i: Pick<CartItem, "product_id" | "variant_id">) =>
  `${i.product_id}:${i.variant_id || ""}`;
export function sanitizeCart(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input
    .filter(
      (i): i is CartItem =>
        !!i &&
        typeof i.product_id === "string" &&
        (i.variant_id === null || typeof i.variant_id === "string") &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0 &&
        i.quantity <= 99,
    )
    .filter((i) => {
      const k = cartKey(i);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 50);
}
export function resolveCart(items: CartItem[], products: Product[]) {
  return items.map((item) => {
    const product = products.find((p) => p.id === item.product_id);
    const variant = product?.product_variants.find(
      (v) => v.id === item.variant_id && v.active,
    );
    const valid = !!product && (!item.variant_id || !!variant);
    return {
      item,
      product,
      variant,
      price: variant?.price_minor ?? product?.price_minor ?? 0,
      stock: valid ? (variant?.stock ?? product?.stock ?? 0) : 0,
      valid,
    };
  });
}
export function cartTotal(items: CartItem[], products: Product[]) {
  return resolveCart(items, products).reduce(
    (sum, r) => sum + r.price * r.item.quantity,
    0,
  );
}
