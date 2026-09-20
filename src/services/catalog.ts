import { supabase } from "../lib/supabase";
import { demoProducts, demoCategories } from "../data/demo";
import type { Product, Category, SiteSettings } from "../types";
export async function loadCatalog(): Promise<{
  products: Product[];
  categories: Category[];
  settings: Partial<SiteSettings>;
}> {
  if (!supabase)
    return { products: demoProducts, categories: demoCategories, settings: {} };
  const [p, c, s] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .eq("published", true)
      .order("capacity")
      .limit(1000),
    supabase.from("categories").select("*").order("slug"),
    supabase
      .from("site_settings")
      .select("value")
      .eq("id", "store")
      .maybeSingle(),
  ]);
  if (p.error || c.error || s.error) throw new Error("genericError");
  return {
    products: (p.data || []) as Product[],
    categories: (c.data || []) as Category[],
    settings: s.data?.value || {},
  };
}
export async function loadCartProducts(ids: string[]): Promise<Product[]> {
  if (!supabase) return demoProducts.filter((p) => ids.includes(p.id));
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .in("id", ids);
  if (error) throw new Error("genericError");
  return data as Product[];
}
