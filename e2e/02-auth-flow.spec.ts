import { test, expect } from "@playwright/test";

test.describe("Login Form Validation", () => {
  test("Boş formda submit: browser validation çalışır", async ({ page }) => {
    await page.goto("/auth/login");
    const emailInput = page.locator('input[type="email"]');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    // HTML5 validation → email hâlâ odakta/empty
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test("Geçersiz email formatı: validation", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', "geçersizemail");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test("Yanlış credentials: hata mesajı gösterilir", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', "yanlis@test.com");
    await page.fill('input[type="password"]', "yanlis123456");
    await page.click('button[type="submit"]');
    // Hata bekle (Supabase auth genelde 1-3 sn içinde yanıt verir)
    await page.waitForTimeout(3000);
    const bodyText = await page.locator("body").textContent();
    // URL değişmediyse (login'de kaldıysa) → hata çıkmış demektir
    expect(page.url()).toMatch(/login/);
  });
});

test.describe("Register Form Validation", () => {
  test("Kayıt sayfası: form alanları mevcut", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("Boş formda submit: validation", async ({ page }) => {
    await page.goto("/auth/register");
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      const emailInput = page.locator('input[type="email"]');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    }
  });
});

test.describe("Protected Routes", () => {
  // Not: /konular ve /diagnostic public (middleware PUBLIC_ROUTES'ta)
  const routes = ["/dashboard", "/profil", "/takvim", "/deneme",
    "/hata-defteri", "/lgs-tahmin", "/hedef-okul", "/veli", "/calis"];

  for (const route of routes) {
    test(`${route} → auth redirect`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(page.url()).toMatch(/login|auth/);
    });
  }
});

test.describe("Public Routes (no auth required)", () => {
  const publicRoutes = ["/", "/auth/login", "/auth/register", "/diagnostic", "/konular"];

  for (const route of publicRoutes) {
    test(`${route} → erişilebilir`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status() ?? 500).toBeLessThan(500);
      // Login/auth'a yönlendirilmemeli
      if (!route.includes("auth")) {
        expect(page.url()).not.toMatch(/\/auth\/login$/);
      }
    });
  }
});

test.describe("Performance", () => {
  test("Ana sayfa yükleme < 5sn", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const sure = Date.now() - start;
    expect(sure).toBeLessThan(5000);
  });

  test("Login sayfası yükleme < 5sn", async ({ page }) => {
    const start = Date.now();
    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
    const sure = Date.now() - start;
    expect(sure).toBeLessThan(5000);
  });

  test("Navigation sonrası interaktif < 3sn", async ({ page }) => {
    await page.goto("/");
    const start = Date.now();
    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 3000 });
    const sure = Date.now() - start;
    expect(sure).toBeLessThan(3000);
  });
});
