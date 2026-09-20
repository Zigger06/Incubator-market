import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Product, Category, CartItem, SiteSettings } from "../types";
import { defaultSettings } from "../config/site";
import { loadCatalog } from "../services/catalog";
import { readLocal, writeLocal } from "../lib/storage";
import { cartKey, sanitizeCart } from "../features/cart/model";
import { supabase } from "../lib/supabase";
import { useAuth } from "../features/auth/AuthProvider";
interface Store {
  products: Product[];
  categories: Category[];
  settings: SiteSettings;
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
  cart: CartItem[];
  setCart: (v: CartItem[]) => void;
  add: (p: Product, q?: number, variant?: string | null) => void;
  favorites: string[];
  toggleFavorite: (id: string) => Promise<void>;
  notice: string;
  notify: (s: string) => void;
}
const Context = createContext<Store>(null!);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cart, updateCart] = useState(() =>
    sanitizeCart(readLocal("im:cart", [])),
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notice, notify] = useState("");
  const { user } = useAuth();
  const reload = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const d = await loadCatalog();
      setProducts(d.products);
      setCategories(d.categories);
      setSettings({ ...defaultSettings, ...d.settings });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    writeLocal("im:cart", cart);
  }, [cart]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => notify(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    let active = true;
    setFavorites([]);
    if (user && supabase) {
      supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user.id)
        .then(({ data, error }) => {
          if (active) {
            if (error) notify("genericError");
            else setFavorites((data || []).map((f) => f.product_id));
          }
        });
    } else {
      const local = readLocal<unknown>("im:favorites", []);
      setFavorites(
        Array.isArray(local) ? local.filter((v) => typeof v === "string") : [],
      );
    }
    return () => {
      active = false;
    };
  }, [user]);
  async function toggleFavorite(id: string) {
    const exists = favorites.includes(id);
    if (user && supabase) {
      const result = exists
        ? await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", id)
        : await supabase
            .from("favorites")
            .insert({ user_id: user.id, product_id: id });
      if (result.error) {
        notify("genericError");
        return;
      }
    }
    const next = exists
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(next);
    if (!user) writeLocal("im:favorites", next);
  }
  function add(p: Product, q = 1, variant: string | null = null) {
    const v = p.product_variants.find((v) => v.id === variant && v.active);
    const stock = v?.stock ?? p.stock;
    if (stock < 1 || !Number.isInteger(q) || q < 1 || q > 99) return;
    updateCart((prev) => {
      const key = cartKey({ product_id: p.id, variant_id: variant });
      const existing = prev.find((i) => cartKey(i) === key);
      if (existing)
        return prev.map((i) =>
          cartKey(i) === key
            ? { ...i, quantity: Math.min(stock, 99, i.quantity + q) }
            : i,
        );
      return [
        ...prev,
        { product_id: p.id, variant_id: variant, quantity: Math.min(stock, q) },
      ];
    });
    notify("added");
  }
  return (
    <Context.Provider
      value={{
        products,
        categories,
        settings,
        loading,
        error,
        reload,
        cart,
        setCart: (v) => updateCart(sanitizeCart(v)),
        add,
        favorites,
        toggleFavorite,
        notice,
        notify,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
