import type { SiteSettings } from "../types";
export const defaultSettings: SiteSettings = {
  name: "Incubator Market",
  phone: "",
  whatsapp: "",
  telegram: "",
  address: {
    tj: "Душанбе, Корвон, бинои «Душанбе», ошёнаи 2",
    ru: "Душанбе, Корвон, здание «Душанбе», 2-й этаж",
  },
  hours: "07:00–20:00",
  hero: {
    tj: "Аз як тухм — то оғози кори худ.",
    ru: "Из одного яйца — в своё дело.",
  },
  delivery: {
    tj: "Расонидан дар Тоҷикистон. Нарх ва муҳлатро пеш аз тасдиқи фармоиш мувофиқа мекунем.",
    ru: "Доставка по Таджикистану. Стоимость и срок согласуем до подтверждения заказа.",
  },
};
export const featureLabels = {
  auto_turn: { tj: "Гардиши автоматӣ", ru: "Автопереворот" },
  humidity: { tj: "Назорати намӣ", ru: "Контроль влажности" },
  backup: { tj: "Ғизодиҳии эҳтиётӣ", ru: "Резервное питание" },
};
