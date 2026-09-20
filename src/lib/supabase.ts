import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
function safeKey(k: string) {
  if (k.startsWith("sb_secret_")) return false;
  try {
    if (
      k.split(".").length === 3 &&
      JSON.parse(atob(k.split(".")[1])).role !== "anon"
    )
      return false;
  } catch {
    return false;
  }
  return true;
}
export const supabase =
  url && key && safeKey(key)
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;
export const isDemo = !supabase;
export function requireBackend() {
  if (!supabase) throw new Error("unavailable");
  return supabase;
}
