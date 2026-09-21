import { test, expect } from "@playwright/test";
import { offlineSite, ready } from "./helpers";
const routes = [
  ["home", "/"],
  ["catalog", "/catalog"],
  ["product", "/product/incubator-64"],
  ["favorites", "/favorites"],
  ["login", "/auth"],
  ["register", "/auth?mode=register"],
  ["contact", "/contact"],
];
for (const locale of ["tj", "ru"])
  for (const dark of [false, true])
    for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
      test(`layout ${locale} ${dark ? "dark" : "light"} ${width}px`, async ({
        page,
      }, testInfo) => {
        await offlineSite(page, dark, locale);
        await page.setViewportSize({ width, height: 960 });
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        for (const [name, path] of routes) {
          await ready(page, path);
          if (name === "product")
            await expect(page.locator(".product-purchase")).toBeVisible();
          await expect(page.locator("html")).toHaveClass(dark ? /dark/ : /^$/);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            name,
          ).toBe(true);
          // Check actual rendered text against its nearest opaque surface, including inputs.
          const violations = await page.evaluate(() => {
            const rgb = (s: string) =>
              s.match(/[\d.]+/g)?.map(Number) || [0, 0, 0];
            const luminance = (v: number[]) =>
              v
                .slice(0, 3)
                .map((n) => n / 255)
                .map((n) =>
                  n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4,
                )
                .reduce((n, c, i) => n + c * [0.2126, 0.7152, 0.0722][i], 0);
            const bad: string[] = [];
            for (const el of document.querySelectorAll<HTMLElement>("body *")) {
              if (
                !el.checkVisibility() ||
                el.closest("[disabled], [aria-disabled=true]") ||
                el.tagName === "OPTION"
              )
                continue;
              const hasText = [...el.childNodes].some(
                (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
              );
              if (!hasText && !el.matches("input,textarea,select")) continue;
              const style = getComputedStyle(el);
              let ancestor: HTMLElement | null = el;
              let bg = "";
              while (ancestor) {
                bg = getComputedStyle(ancestor).backgroundColor;
                const rgba = rgb(bg);
                if (rgba.length === 3 || rgba[3] === 1) break;
                ancestor = ancestor.parentElement;
              }
              if (!ancestor) continue;
              const fgL = luminance(rgb(style.color)),
                bgL = luminance(rgb(bg));
              const ratio =
                (Math.max(fgL, bgL) + 0.05) / (Math.min(fgL, bgL) + 0.05);
              const large =
                parseFloat(style.fontSize) >= 24 ||
                (parseFloat(style.fontSize) >= 18.66 &&
                  parseInt(style.fontWeight) >= 700);
              if (ratio < (large ? 3 : 4.5))
                bad.push(
                  `${el.tagName}.${el.className}: ${el.textContent?.trim().slice(0, 45)} (${ratio.toFixed(2)})`,
                );
            }
            return bad;
          });
          expect(violations, `${name} text contrast`).toEqual([]);
          await page.screenshot({
            path: testInfo.outputPath(`${name}.png`),
            fullPage: true,
          });
        }
        expect(errors).toEqual([]);
      });
    }
test("navigation, theme persistence, favorites and small results", async ({
  page,
}) => {
  await offlineSite(page, false, "ru");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page, "/catalog");
  await expect(
    page
      .locator("header nav")
      .getByRole("link", { name: "Категории", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Тёмная тема", exact: true }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.getByRole("textbox", { name: "Поиск", exact: true }).fill("64");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".single-result")).toBeVisible();
  await page.locator(".favorite").click();
  await page
    .getByRole("link", { name: "Избранное", exact: true })
    .first()
    .click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Поиск", exact: true })
    .fill("nothing-matches");
  await expect(
    page.getByText("Среди избранного нет подходящих товаров"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Сбросить", exact: true })
    .last()
    .click();
  await page.locator(".favorite").click();
  await expect(page.getByText("Сохраните понравившиеся товары")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "В каталог", exact: true }),
  ).toBeVisible();
});
test("mobile contact sheet traps focus, closes with Escape and opens specialist form", async ({
  page,
}, testInfo) => {
  await offlineSite(page, true, "ru");
  await page.setViewportSize({ width: 320, height: 740 });
  await ready(page, "/");
  const trigger = page.getByRole("button", {
    name: "Связаться с нами",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("contact-sheet.png") });
  await expect(dialog.locator("a[href*='wa.me'], a[href*='t.me']")).toHaveCount(
    0,
  );
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "Написать специалисту" }).click();
  await expect(page.locator("main h1")).toHaveText("Контакты");
  await expect(dialog).not.toBeVisible();
  await page.getByLabel("Как с вами связаться").selectOption("telegram");
  await expect(page.getByLabel("Имя пользователя в Telegram")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Отправить", exact: true }),
  ).toBeDisabled();
});
test("Tajik registration labels, show-password control and mobile menu", async ({
  page,
}) => {
  await offlineSite(page, false);
  await page.setViewportSize({ width: 375, height: 850 });
  await ready(page, "/auth?mode=register");
  await expect(page.locator("main h1")).toHaveText("Бақайдгирӣ");
  await expect(
    page.getByRole("button", { name: "Ба қайд гирифтан", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Рамз", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("checkbox", { name: "Нишон додани рамз" }).check();
  await expect(
    page.getByLabel("Такрори рамз", { exact: true }),
  ).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Меню", exact: true }).click();
  await expect(page.locator("header nav")).toBeVisible();
  await expect(
    page
      .locator("header nav")
      .getByRole("link", { name: "Кафолат", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Намуди торик", exact: true }).click();
  await expect(page.locator("html")).toHaveClass("dark");
});

for (const dark of [false, true])
  test(`small catalog and empty search ${dark ? "dark" : "light"}`, async ({
    page,
  }, testInfo) => {
    await offlineSite(page, dark, "ru");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await ready(page, "/catalog?max=1000");
    await expect(page.locator(".product-card")).toHaveCount(2);
    await expect(page.locator(".sparse-results")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("two-products.png"),
      fullPage: true,
    });
    await page.getByRole("textbox", { name: "Поиск", exact: true }).fill("64");
    await expect(page.locator(".single-result")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("one-product.png"),
      fullPage: true,
    });
    await page
      .getByRole("textbox", { name: "Поиск", exact: true })
      .fill("no-match");
    await expect(
      page.getByRole("heading", { name: "Товары не найдены" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("no-products.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.getByRole("button", { name: "Фильтры", exact: true }).click();
    await expect(page.locator("#catalog-filters")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
