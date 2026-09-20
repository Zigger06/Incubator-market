import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { messages, type MessageKey } from "./messages";
import type { Locale, Localized } from "../types";
import { readLocal, writeLocal } from "../lib/storage";
const Context = createContext<{
  locale: Locale;
  setLocale: (v: Locale) => void;
  t: (k: MessageKey) => string;
  local: (v: Localized) => string;
  money: (v: number) => string;
}>(null!);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() =>
    readLocal<string>("im:locale", "tj") === "ru" ? "ru" : "tj",
  );
  useEffect(() => {
    writeLocal("im:locale", locale);
    document.documentElement.lang = locale === "tj" ? "tg" : "ru";
  }, [locale]);
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (k: MessageKey) => messages[locale][k],
      local: (v: Localized) => v?.[locale] || v?.ru || "",
      money: (v: number) =>
        new Intl.NumberFormat(locale === "tj" ? "tg-TJ" : "ru-RU", {
          maximumFractionDigits: 2,
        }).format(v / 100) +
        " " +
        messages[locale].currency,
    }),
    [locale],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useI18n = () => useContext(Context);
