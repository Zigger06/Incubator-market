import { describe, expect, it } from "vitest";
import {
  consultationMessage,
  contactLinks,
} from "../src/features/contact/links";
import { contactSchema } from "../src/lib/validation";
import { defaultSettings } from "../src/config/site";

describe("consultation links", () => {
  it("does not invent contact destinations when settings are empty or unsafe", () => {
    expect(contactLinks(defaultSettings, "hello")).toEqual({
      phone: null,
      whatsapp: null,
      telegram: null,
    });
    expect(
      contactLinks(
        {
          phone: "javascript:123",
          whatsapp: "https://wrong",
          telegram: "evil/path",
        },
        "hello",
      ),
    ).toEqual({ phone: null, whatsapp: null, telegram: null });
  });
  it("encodes product context including the price, variant and complete hash URL", () => {
    const message = consultationMessage("tj", {
      name: "Тест & 48",
      capacity: 48,
      price: "1 200 сомонӣ",
      variant: "12V",
      quantity: 2,
      url: "https://example.test/#/product/test?variant=12&qty=2",
    });
    const links = contactLinks(
      {
        phone: "+992 90 123 45 67",
        whatsapp: "+992 90 123 45 67",
        telegram: "@store_test",
      },
      message,
    );
    const url = new URL(links.whatsapp!);
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/992901234567");
    expect(url.searchParams.get("text")).toBe(message);
    for (const part of [
      "Салом!",
      "Тест & 48",
      "48 тухм",
      "1 200 сомонӣ",
      "12V",
      "2",
      "https://example.test/#/product/test?variant=12&qty=2",
    ])
      expect(message).toContain(part);
    expect(links.telegram).toBe("https://t.me/store_test");
    expect(links.phone).toBe("tel:+992901234567");
  });
  it("provides localized general greetings with no product data", () => {
    expect(consultationMessage("tj")).toMatch(/^Салом!/);
    expect(consultationMessage("ru")).toMatch(/^Здравствуйте!/);
    expect(consultationMessage("ru")).not.toContain("undefined");
  });
});
const valid = {
  name: "Test User",
  phone: "901234567",
  subject: "Consultation",
  message: "Please help me choose a model",
  website: "",
};
describe("preferred contact channel", () => {
  it("preserves old callers as phone callbacks and normalizes the number", () => {
    expect(contactSchema.parse(valid)).toMatchObject({
      preferred_channel: "phone",
      phone: "+992901234567",
      telegram_username: "",
    });
  });
  it("requires and normalizes a reachable Telegram username", () => {
    expect(
      contactSchema.safeParse({ ...valid, preferred_channel: "telegram" })
        .success,
    ).toBe(false);
    expect(
      contactSchema.safeParse({
        ...valid,
        preferred_channel: "telegram",
        telegram_username: "../../x",
      }).success,
    ).toBe(false);
    expect(
      contactSchema.parse({
        ...valid,
        preferred_channel: "telegram",
        telegram_username: " @test_user ",
      }).telegram_username,
    ).toBe("test_user");
  });
  it("discards stale Telegram data for a different channel and rejects unknown channels", () => {
    expect(
      contactSchema.parse({
        ...valid,
        preferred_channel: "whatsapp",
        telegram_username: "old_user",
      }).telegram_username,
    ).toBe("");
    expect(
      contactSchema.safeParse({ ...valid, preferred_channel: "unknown" })
        .success,
    ).toBe(false);
  });
});
