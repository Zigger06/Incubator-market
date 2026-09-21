import { test, expect, type Page, type Route } from "@playwright/test";
import { offlineSite, ready } from "./helpers";
import { demoProducts, demoCategories } from "../src/data/demo";
// All destinations and credentials below are fixtures. Every request is intercepted.
// No authentication, message or order is sent to a live service.
const fixtureUser = {
  id: "30000000-0000-4000-8000-000000000099",
  phone: "992901234567",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2026-09-20T00:00:00Z",
};
const session = () => ({
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: fixtureUser,
});
async function mockSite(
  page: Page,
  handler?: (route: Route) => Promise<boolean>,
) {
  await offlineSite(page, true, "ru");
  await page.route("https://test.supabase.co/**", async (route) => {
    if (handler && (await handler(route))) return;
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith("/products")
      ? demoProducts
      : path.endsWith("/categories")
        ? demoCategories
        : path.endsWith("/site_settings")
          ? { value: { whatsapp: "+992901234567", telegram: "store_test" } }
          : path.endsWith("/is_admin")
            ? false
            : path.endsWith("/profiles")
              ? {
                  id: fixtureUser.id,
                  name: "Test User",
                  phone: "+992901234567",
                  address: "Test address",
                }
              : [];
    await route.fulfill({ json: data });
  });
}
test("registration validates mismatch, shows pending and reaches OTP and account", async ({
  page,
}, testInfo) => {
  let registerCalls = 0;
  let completeRegistration: (() => Promise<void>) | undefined;
  await mockSite(page, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/signup")) {
      registerCalls++;
      completeRegistration = () =>
        route.fulfill({ json: { user: fixtureUser, session: null } });
      return true;
    }
    if (path.endsWith("/verify")) {
      await route.fulfill({ json: session() });
      return true;
    }
    return false;
  });
  await page.setViewportSize({ width: 390, height: 850 });
  await ready(page, "/auth?mode=register");
  await page.getByLabel("Телефон", { exact: true }).fill("901234567");
  await page.getByLabel("Пароль", { exact: true }).fill("test-only-password");
  await page
    .getByLabel("Повтор пароля", { exact: true })
    .fill("different-password");
  await page
    .getByRole("button", { name: "Зарегистрироваться", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveText("Пароли не совпадают.");
  expect(registerCalls).toBe(0);
  await page.screenshot({
    path: testInfo.outputPath("register-error.png"),
    fullPage: true,
  });
  await page
    .getByLabel("Повтор пароля", { exact: true })
    .fill("test-only-password");
  await page
    .getByRole("button", { name: "Зарегистрироваться", exact: true })
    .click();
  await expect(page.locator("form")).toHaveAttribute("aria-busy", "true");
  await expect(
    page.getByRole("button", { name: "Загрузка…", exact: true }),
  ).toBeDisabled();
  await expect.poll(() => !!completeRegistration).toBe(true);
  await completeRegistration!();
  await expect(page.getByLabel("Код подтверждения")).toBeVisible();
  await page.getByLabel("Код подтверждения").fill("123456");
  await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  await expect(page.locator("main h1")).toHaveText("Мой кабинет");
});
test("login failure stays on the form and a retry can sign in", async ({
  page,
}, testInfo) => {
  let calls = 0;
  await mockSite(page, async (route) => {
    if (!new URL(route.request().url()).pathname.endsWith("/token"))
      return false;
    calls++;
    await route.fulfill(
      calls === 1
        ? {
            status: 400,
            json: {
              error_code: "invalid_credentials",
              msg: "Invalid login credentials",
            },
          }
        : { json: session() },
    );
    return true;
  });
  await ready(page, "/auth");
  await page.getByLabel("Телефон", { exact: true }).fill("12");
  await page.getByLabel("Пароль", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Введите номер");
  expect(calls).toBe(0);
  await page.getByLabel("Телефон", { exact: true }).fill("901234567");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Не удалось войти. Проверьте номер и пароль.",
  );
  await page.screenshot({
    path: testInfo.outputPath("login-error.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.locator("main h1")).toHaveText("Мой кабинет");
});
test("contact pending, failed submission and successful retry preserve the selected channel", async ({
  page,
}, testInfo) => {
  let calls = 0;
  let complete: (() => Promise<void>) | undefined;
  let payload: Record<string, string> = {};
  await mockSite(page, async (route) => {
    if (
      !new URL(route.request().url()).pathname.endsWith("/functions/v1/contact")
    )
      return false;
    calls++;
    payload = route.request().postDataJSON();
    complete = () =>
      route.fulfill(
        calls === 1
          ? { status: 503, json: { error: "Please try later" } }
          : { json: { ok: true } },
      );
    return true;
  });
  await page.setViewportSize({ width: 390, height: 850 });
  await ready(page, "/contact");
  await page.getByLabel("Имя", { exact: true }).fill("Test User");
  await page.getByLabel("Телефон", { exact: true }).fill("901234567");
  await page.getByLabel("Как с вами связаться").selectOption("telegram");
  await page.getByLabel("Имя пользователя в Telegram").fill("@test_user");
  await page
    .getByLabel("Сообщение", { exact: true })
    .fill("Please help me choose an incubator");
  await page.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(page.locator("form")).toHaveAttribute("aria-busy", "true");
  await expect.poll(() => !!complete).toBe(true);
  await complete!();
  await expect(page.getByRole("alert")).toContainText(
    "Не удалось выполнить действие",
  );
  await expect(page.getByLabel("Имя", { exact: true })).toHaveValue(
    "Test User",
  );
  await page.screenshot({
    path: testInfo.outputPath("contact-error.png"),
    fullPage: true,
  });
  complete = undefined;
  await page.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect.poll(() => !!complete).toBe(true);
  await complete!();
  await expect(page.getByRole("status")).toHaveText("Ваше сообщение принято.");
  expect(payload).toMatchObject({
    phone: "+992901234567",
    preferred_channel: "telegram",
    telegram_username: "test_user",
  });
  await expect(page.getByLabel("Имя", { exact: true })).toHaveValue("");
  await page.screenshot({
    path: testInfo.outputPath("contact-success.png"),
    fullPage: true,
  });
});
test("configured product WhatsApp links include context in both the page and global widget", async ({
  page,
}) => {
  await mockSite(page);
  await ready(page, "/product/incubator-64");
  await page.getByLabel("Количество", { exact: true }).fill("2");
  const href = await page
    .locator(".product-purchase a[href*='wa.me']")
    .getAttribute("href");
  const message = new URL(href!).searchParams.get("text")!;
  for (const part of [
    "Здравствуйте!",
    "Инкубатор 64",
    "64 яиц",
    "950",
    "Количество: 2",
    "#/product/incubator-64",
  ])
    expect(message).toContain(part);
  await page
    .getByRole("button", { name: "Связаться с нами", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator("a[href*='wa.me']"),
  ).toHaveAttribute("href", href!);
  await expect(
    page.getByRole("dialog").locator("a[href*='t.me']"),
  ).toHaveAttribute("href", "https://t.me/store_test");
});
