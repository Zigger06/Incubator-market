import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductContact } from "./links";
const Context = createContext<{
  product: ProductContact | null;
  setProduct: (value: ProductContact | null) => void;
}>(null!);
export function ContactProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<ProductContact | null>(null);
  const value = useMemo(() => ({ product, setProduct }), [product]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useContact = () => useContext(Context);
