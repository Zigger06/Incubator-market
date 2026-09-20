import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
const Context = createContext<{
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}>(null!);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [isAdmin, setAdmin] = useState(false);
  useEffect(() => {
    try {
      localStorage.removeItem("incubator_users");
      localStorage.removeItem("incubator_current_user");
    } catch {
      /* Remove unsafe legacy auth when storage permits. */
    }
    if (!supabase) return;
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    setAdmin(false);
    if (user && supabase)
      supabase.rpc("is_admin").then(({ data }) => {
        if (active) setAdmin(data === true);
      });
    return () => {
      active = false;
    };
  }, [user]);
  async function logout() {
    const result = await supabase?.auth.signOut();
    if (result?.error) throw new Error("genericError");
    setUser(null);
    setAdmin(false);
  }
  return (
    <Context.Provider value={{ user, loading, isAdmin, logout }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
