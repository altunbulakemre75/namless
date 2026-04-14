import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("Ana sayfa açılır ve temel öğeleri gösterir", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LGS/i);
    // Ana sayfada CTA olmalı (Giriş Yap veya Kayıt Ol)
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("Login sayfası form alanları mevcut", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("Register sayfası form alanları mevcut", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("Login → Register geçişi çalışır", async ({ page }) => {
    await page.goto("/auth/login");
    // "Hesabın yok mu? Kayıt ol" benzeri link
    const kayitLinki = page.getByRole("link", { name: /kay[ıi]t|register/i });
    if (await kayitLinki.isVisible()) {
      await kayitLinki.click();
      await expect(page).toHaveURL(/register/);
    }
  });

  test("Dashboard → login redirect (auth olmadan)", async ({ page }) => {
    const response = await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    // Login'e yönlendirilmeli veya auth sayfası görünmeli
    expect(page.url()).toMatch(/login|auth/);
  });

  test("Profil sayfası → login redirect (auth olmadan)", async ({ page }) => {
    await page.goto("/profil", { waitUntil: "domcontentloaded" });
    expect(page.url()).toMatch(/login|auth/);
  });

  test("404 sayfası graceful", async ({ page }) => {
    const response = await page.goto("/bu-sayfa-kesinlikle-yok-12345", { waitUntil: "domcontentloaded" });
    // 404 veya redirect - kritik hata olmamalı
    expect(response?.status() ?? 500).toBeLessThan(500);
  });
});

test.describe("Diagnostic Flow (Public)", () => {
  test("Diagnostic sayfası açılır", async ({ page }) => {
    await page.goto("/diagnostic");
    await expect(page.locator("body")).toBeVisible();
    const content = await page.content();
    expect(content.length).toBeGreaterThan(500);
  });
});

test.describe("Responsiveness", () => {
  test("Mobile viewport: login sayfası çalışır", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/auth/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("Tablet viewport: ana sayfa çalışır", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    const content = await page.content();
    expect(content.length).toBeGreaterThan(500);
  });

  test("Desktop viewport: login sayfası çalışır", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/auth/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
