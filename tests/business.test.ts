import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  formatPhone,
  registerSchema,
  checkoutSchema,
  contactSchema,
} from "../src/lib/validation";
import {
  cartTotal,
  sanitizeCart,
  resolveCart,
} from "../src/features/cart/model";
import { demoProducts } from "../src/data/demo";
import { messages } from "../src/i18n/messages";
describe("Tajik phone and forms", () => {
  it.each([
    "+992 90 123 45 67",
    "992901234567",
    "901234567",
    "(+992) 90-123-45-67",
  ])("normalizes %s", (p) => expect(normalizePhone(p)).toBe("+992901234567"));
  it.each([
    "+79012345678",
    "abc901234567",
    "+99290123",
    "99290123456789",
    "901234567<script>",
  ])("rejects %s", (p) => expect(normalizePhone(p)).toBe(""));
  it("formats for display", () =>
    expect(formatPhone("901234567")).toBe("+992 90 123 45 67"));
  it("rejects nonmatching passwords", () =>
    expect(
      registerSchema.safeParse({
        phone: "901234567",
        password: "12345678",
        confirm: "87654321",
      }).success,
    ).toBe(false));
  it("requires address for delivery only", () => {
    const base = {
      name: "Test",
      phone: "901234567",
      city: "Dushanbe",
      comment: "",
      address: "",
    };
    expect(
      checkoutSchema.safeParse({ ...base, delivery: "delivery" }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...base, delivery: "pickup" }).success,
    ).toBe(true);
  });
  it("rejects honeypot", () =>
    expect(
      contactSchema.safeParse({
        name: "Test",
        phone: "901234567",
        subject: "Question",
        message: "Sample question.",
        website: "spam",
      }).success,
    ).toBe(false));
});
describe("cart", () => {
  it("calculates integer dirams", () =>
    expect(
      cartTotal(
        [{ product_id: demoProducts[0].id, variant_id: null, quantity: 3 }],
        demoProducts,
      ),
    ).toBe(195000));
  it("rejects corrupt and duplicate saved state", () => {
    const p = { product_id: "x", variant_id: null, quantity: 2 };
    expect(
      sanitizeCart([p, p, { ...p, quantity: -1 }, { ...p, quantity: 1.5 }]),
    ).toEqual([p]);
    expect(sanitizeCart({})).toEqual([]);
  });
  it("does not validate an unavailable variant as base stock", () =>
    expect(
      resolveCart(
        [
          {
            product_id: demoProducts[0].id,
            variant_id: "missing",
            quantity: 1,
          },
        ],
        demoProducts,
      )[0].valid,
    ).toBe(false));
  it("uses variant price and stock", () => {
    const p = {
      ...demoProducts[0],
      product_variants: [
        {
          id: "v",
          product_id: demoProducts[0].id,
          name: { tj: "v", ru: "v" },
          price_minor: 120001,
          stock: 2,
          active: true,
        },
      ],
    };
    expect(
      cartTotal([{ product_id: p.id, variant_id: "v", quantity: 2 }], [p]),
    ).toBe(240002);
  });
  it("has full language parity", () =>
    expect(Object.keys(messages.tj).sort()).toEqual(
      Object.keys(messages.ru).sort(),
    ));
});
