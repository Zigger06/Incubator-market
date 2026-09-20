export type Locale = "tj" | "ru";
export type Localized = Record<Locale, string>;
export interface Category {
  id: string;
  name: Localized;
  slug: string;
}
export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
  storage_path?: string;
}
export interface ProductVariant {
  id: string;
  product_id: string;
  name: Localized;
  price_minor: number;
  stock: number;
  active: boolean;
}
export interface Product {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  category_id: string;
  price_minor: number;
  old_price_minor: number | null;
  capacity: number;
  stock: number;
  type: string;
  features: string[];
  specs: Record<string, string>;
  published: boolean;
  featured: boolean;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}
export interface CartItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
}
export interface UserProfile {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}
export type OrderStatus =
  "new" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export const orderStatuses: OrderStatus[] = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
export interface OrderItem {
  id: string;
  name: Localized;
  quantity: number;
  unit_price_minor: number;
  variant_name: Localized | null;
}
export interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  name: string;
  phone: string;
  city: string;
  address: string;
  delivery: string;
  comment: string;
  total_minor: number;
  created_at: string;
  order_items: OrderItem[];
}
export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  created_at: string;
}
export interface SiteSettings {
  name: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  address: Localized;
  hours: string;
  hero: Localized;
  delivery: Localized;
}
