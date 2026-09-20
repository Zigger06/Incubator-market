import { requireBackend } from "../lib/supabase";
import type {
  Product,
  Category,
  Order,
  ContactMessage,
  UserProfile,
  SiteSettings,
  OrderStatus,
} from "../types";
export async function adminRows<T>(table: string, select = "*"): Promise<T[]> {
  const { data, error } = await requireBackend()
    .from(table)
    .select(select)
    .limit(1000);
  if (error) throw new Error("genericError");
  return data as T[];
}
export const adminCatalog = () =>
  adminRows<Product>("products", "*, product_images(*), product_variants(*)");
export const adminCategories = () => adminRows<Category>("categories");
export const adminOrders = () =>
  adminRows<Order>("orders", "*, order_items(*)");
export const adminMessages = () =>
  adminRows<ContactMessage>("contact_messages");
export const adminProfiles = () => adminRows<UserProfile>("profiles");
export async function saveProduct(
  product: Omit<Product, "product_images" | "product_variants">,
  variants: Product["product_variants"],
) {
  const { error } = await requireBackend().rpc("admin_save_product", {
    p_product: product,
    p_variants: variants,
  });
  if (error) throw new Error("genericError");
}
export async function saveCategory(category: Category) {
  const { error } = await requireBackend().from("categories").upsert(category);
  if (error) throw new Error("genericError");
}
export async function deleteRecord(
  table: "products" | "categories",
  id: string,
) {
  const { error } = await requireBackend().from(table).delete().eq("id", id);
  if (error) throw new Error("genericError");
}
export async function updateStatus(id: string, status: OrderStatus) {
  const { error } = await requireBackend().rpc("admin_set_order_status", {
    p_order_id: id,
    p_status: status,
  });
  if (error) throw new Error("genericError");
}
export async function saveSettings(value: SiteSettings) {
  const { error } = await requireBackend()
    .from("site_settings")
    .upsert({ id: "store", value });
  if (error) throw new Error("genericError");
}
export async function uploadImage(productId: string, file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("photoLimit");
  const client = requireBackend();
  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[file.type];
  const path = `${productId}/${crypto.randomUUID()}.${extension}`;
  const upload = await client.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) throw new Error("genericError");
  const { data } = client.storage.from("product-images").getPublicUrl(path);
  const result = await client
    .from("product_images")
    .insert({
      product_id: productId,
      url: data.publicUrl,
      storage_path: path,
      position: Date.now() % 1000000,
    });
  if (result.error) {
    await client.storage.from("product-images").remove([path]);
    throw new Error("genericError");
  }
}
export async function deleteImage(id: string, path?: string) {
  const client = requireBackend();
  if (path) {
    const { error } = await client.storage
      .from("product-images")
      .remove([path]);
    if (error) throw new Error("genericError");
  }
  const { error } = await client.from("product_images").delete().eq("id", id);
  if (error) throw new Error("genericError");
}
