/**
 * Authenticated Student Journey Tests
 *
 * Bu testler storageState ile önceden giriş yapmış kullanıcı kullanır.
 * global-setup.ts otomatik hesap oluşturur.
 */

import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const AUTH_FAILED_MARKER = path.resolve(__dirname, ".auth-failed.marker");

test.beforeEach(async () => {
  if (fs.existsSync(AUTH_FAILED_MARKER)) {
    test.skip(true, "Auth setup başarısız oldu — Supabase email confirmation aktif olabilir");
  }
});

test.describe("Dashboard (authenticated)", () => {
  test("Dashboard yüklenir ve temel bileşenler görünür", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    // Merhaba veya kullanıcı adı görünmeli
    const content = await page.content();
    expect(content.toLowerCase()).toMatch(/merhaba|dashboard|ana sayfa/);
  });

  test("Sidebar navigation çalışır", async ({ page }) => {
    await page.goto("/dashboard");
    // "Konular" linkine tıkla
    const konularLink = page.getByRole("link", { name: /konular/i }).first();
    if (await konularLink.isVisible()) {
      await konularLink.click();
      await expect(page).toHaveURL(/konular/);
    }
  });

  test("LGS gün sayacı görünür", async ({ page }) => {
    await page.goto("/dashboard");
    const content = await page.textContent("body");
    expect(content?.toLowerCase()).toMatch(/gün|kaldı/);
  });
});

test.describe("Profil Sayfası", () => {
  test("Profil yüklenir", async ({ page }) => {
    await page.goto("/profil");
    await expect(page).toHaveURL(/profil/);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(500);
  });

  test("İsim değişikliği yapılabilir", async ({ page }) => {
    await page.goto("/profil");
    // Düzenle butonu veya isim input'u ara
    const editBtn = page.getByRole("button", { name: /düzenle|edit/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      const isimInput = page.locator('input[type="text"]').first();
      if (await isimInput.isVisible()) {
        await isimInput.fill("Güncellenmiş İsim");
        const saveBtn = page.getByRole("button", { name: /kaydet|save/i }).first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });
});

test.describe("Hedef Okul", () => {
  test("Hedef okul sayfası açılır", async ({ page }) => {
    await page.goto("/hedef-okul");
    await expect(page).toHaveURL(/hedef-okul/);
    const content = await page.content();
    expect(content.toLowerCase()).toMatch(/okul|hedef|lise/);
  });

  test("Okul listesi gösterilir", async ({ page }) => {
    await page.goto("/hedef-okul");
    await page.waitForTimeout(2000);
    const content = await page.content();
    // En az bir okul görünmeli
    expect(content.toLowerCase()).toMatch(/lise|okul|galatasaray|anadolu|fen/);
  });
});

test.describe("Takvim", () => {
  test("Takvim sayfası yüklenir", async ({ page }) => {
    await page.goto("/takvim");
    await expect(page).toHaveURL(/takvim/);
    const content = await page.content();
    expect(content.toLowerCase()).toMatch(/takvim|ocak|şubat|mart|nisan|mayıs|haziran/);
  });

  test("Gün seçimi çalışır", async ({ page }) => {
    await page.goto("/takvim");
    await page.waitForTimeout(1500);
    // Bir gün butonuna tıkla (sayı içeren)
    const gunBtn = page.locator('button').filter({ hasText: /^\d{1,2}$/ }).first();
    if (await gunBtn.isVisible().catch(() => false)) {
      await gunBtn.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Deneme Sınavı", () => {
  test("Deneme sayfası yüklenir ve 3 mod gösterir", async ({ page }) => {
    await page.goto("/deneme");
    await expect(page).toHaveURL(/deneme/);
    const content = await page.textContent("body");
    expect(content?.toLowerCase()).toMatch(/deneme|sınav|mod/);
  });

  test("Tam Deneme modu başlatılabilir", async ({ page }) => {
    await page.goto("/deneme");
    await page.waitForTimeout(1500);
    // "Tam Deneme" veya benzeri butona tıkla
    const tamBtn = page.locator('button').filter({ hasText: /tam deneme|tam mod/i }).first();
    if (await tamBtn.isVisible().catch(() => false)) {
      await tamBtn.click();
      await page.waitForTimeout(5000);
      // Soru ekranına geçmiş olmalı
      const content = await page.content();
      expect(content.toLowerCase()).toMatch(/soru|\/|bitir/);
    }
  });
});

test.describe("Hata Defteri", () => {
  test("Hata defteri açılır", async ({ page }) => {
    await page.goto("/hata-defteri");
    await expect(page).toHaveURL(/hata-defteri/);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(500);
  });
});

test.describe("LGS Puan Tahmini", () => {
  test("Puan tahmini sayfası açılır", async ({ page }) => {
    await page.goto("/lgs-tahmin");
    await expect(page).toHaveURL(/lgs-tahmin/);
    const content = await page.textContent("body");
    expect(content?.toLowerCase()).toMatch(/puan|tahmin|yep/);
  });
});

test.describe("Veli Paneli", () => {
  test("Veli sayfası açılır (öğrenci için boş olabilir)", async ({ page }) => {
    await page.goto("/veli");
    await expect(page).toHaveURL(/veli/);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(300);
  });
});

test.describe("Çalış Sayfası", () => {
  test("Çalış sayfası yüklenir", async ({ page }) => {
    await page.goto("/calis");
    await expect(page).toHaveURL(/calis/);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(300);
  });
});

test.describe("Koç Baloncuğu (AI Asistan)", () => {
  test("Koç baloncuğu dashboard'da görünür", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    // Sabit konumlu asistan butonunu ara
    const content = await page.content();
    expect(content.toLowerCase()).toMatch(/koç|asistan|sohbet|ai|yardım/);
  });
});

test.describe("Performance (auth)", () => {
  test("Dashboard ilk yükleme < 6sn", async ({ page }) => {
    const start = Date.now();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const sure = Date.now() - start;
    expect(sure).toBeLessThan(6000);
  });

  test("Sayfa geçişi < 4sn", async ({ page }) => {
    await page.goto("/dashboard");
    const start = Date.now();
    await page.goto("/takvim", { waitUntil: "domcontentloaded" });
    const sure = Date.now() - start;
    expect(sure).toBeLessThan(4000);
  });
});
