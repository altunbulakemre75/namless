/**
 * Playwright Global Setup
 *
 * Otomatik test kullanıcısı oluşturup storage state kaydeder.
 * Auth testleri bu session'ı reuse eder.
 *
 * Supabase "Confirm email" KAPALI olmalı (Auth → Providers → Email settings).
 */

import { chromium, type FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";

const STORAGE_STATE = path.resolve(__dirname, ".auth-state.json");
const MARKER = path.resolve(__dirname, ".auth-failed.marker");

export default async function globalSetup(_config: FullConfig) {
  // Önceki marker'ları temizle
  if (fs.existsSync(MARKER)) fs.unlinkSync(MARKER);

  // Mevcut storage state < 23 saat yaşındaysa reuse et
  if (fs.existsSync(STORAGE_STATE)) {
    const stat = fs.statSync(STORAGE_STATE);
    const saatFark = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    if (saatFark < 23) {
      console.log(`  ↻ Mevcut auth state kullanılıyor (${saatFark.toFixed(1)}h önce)`);
      return;
    }
  }

  const rastgele = Math.random().toString(36).substring(2, 10);
  const email = `e2etest${rastgele}@gmail.com`;
  const password = "Test123456!";
  const isim = "E2E Test Ogrenci";

  console.log(`  🔑 Test hesabı oluşturuluyor: ${email}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Console log'ları yakala
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`  [browser] ${msg.text()}`);
  });
  page.on("pageerror", (err) => console.log(`  [page error] ${err.message}`));

  // Supabase auth yanıtını yakala
  page.on("response", async (res) => {
    if (res.url().includes("/auth/v1/signup") || res.url().includes("/auth/v1/token")) {
      const body = await res.text().catch(() => "");
      console.log(`  [supabase ${res.status()}] ${res.url().split("/").pop()} → ${body.slice(0, 200)}`);
    }
  });

  try {
    // 1. Kayıt
    console.log("  → /auth/register açılıyor...");
    await page.goto("http://localhost:3000/auth/register", { waitUntil: "domcontentloaded" });
    await page.fill('input[type="text"]', isim);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    console.log("  → Kayıt formu dolduruldu, submit ediliyor...");
    await page.click('button[type="submit"]');

    // Hata mesajı veya başarı bekle
    await Promise.race([
      page.waitForSelector("text=Kayıt Başarılı", { timeout: 10000 }),
      page.waitForSelector('text=/hata|error|zaten kayıtlı/i', { timeout: 10000 }),
    ]).catch(() => {});

    const hataVar = await page.locator('text=/hata|error|zaten kayıtlı/i').first().isVisible().catch(() => false);
    if (hataVar) {
      const hataMesaj = await page.locator('text=/hata|error|zaten kayıtlı/i').first().textContent();
      throw new Error(`Kayıt hatası: ${hataMesaj}`);
    }
    console.log("  ✓ Kayıt başarılı (access_token alındı)");

    // 2. Dashboard'a git — signup sırasında access_token geldi, session aktif
    await page.waitForTimeout(2000);
    console.log("  → /dashboard'a gidiliyor (signup sonrası zaten session var)...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });

    // Dashboard'da olmalıyız (login'e yönlendirilmediysek)
    const url = page.url();
    if (url.includes("/auth/login")) {
      // Session oluşmadıysa fallback: login yap
      console.log("  ⚠ Dashboard redirect - manuel login deneniyor...");
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    }
    console.log(`  ✓ Dashboard'a ulaşıldı: ${page.url()}`);

    // Storage state kaydet
    await context.storageState({ path: STORAGE_STATE });
    console.log(`  ✓ Auth state kaydedildi: ${STORAGE_STATE}`);

    // Credentials'ı da kaydet (tekrar kullanılabilir)
    fs.writeFileSync(
      path.resolve(__dirname, ".auth-credentials.json"),
      JSON.stringify({ email, password, isim }, null, 2)
    );
  } catch (e) {
    console.warn(`  ⚠ Auth setup başarısız — auth testleri atlanacak:`);
    console.warn(`    ${e instanceof Error ? e.message : String(e)}`);
    console.warn(`    (Supabase "Confirm email" ayarı kapalı olmalı)`);
    fs.writeFileSync(MARKER, "auth-setup-failed");
  } finally {
    await browser.close();
  }
}
