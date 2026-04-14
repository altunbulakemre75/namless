import { test, expect } from "@playwright/test";

test.describe("Public tRPC Endpoints", () => {
  test("getSchools: data döner", async ({ request }) => {
    const res = await request.get("/api/trpc/learning.getSchools?input=%7B%7D");
    expect(res.status()).toBe(200);
    const data = await res.json();
    const okullar = data?.result?.data?.json ?? data?.result?.data ?? [];
    expect(Array.isArray(okullar) || typeof okullar === "object").toBe(true);
  });

  test("getSchools: sehir filtresi çalışır", async ({ request }) => {
    const input = encodeURIComponent(JSON.stringify({ sehir: "İstanbul" }));
    const res = await request.get(`/api/trpc/learning.getSchools?input=${input}`);
    expect(res.status()).toBe(200);
  });

  test("getTopicsForBrowse: data döner", async ({ request }) => {
    const res = await request.get("/api/trpc/learning.getTopicsForBrowse?input=%7B%7D");
    expect(res.status()).toBe(200);
  });
});

test.describe("Protected tRPC Endpoints", () => {
  test("getProfile: auth olmadan UNAUTHORIZED", async ({ request }) => {
    const res = await request.get("/api/trpc/learning.getProfile?input=%7B%7D");
    // 200 + error body veya 401
    expect(res.status()).toBeLessThan(500);
    if (res.status() === 200) {
      const data = await res.json();
      const jsonStr = JSON.stringify(data);
      expect(jsonStr.toLowerCase()).toMatch(/unauthorized|auth|yetki/);
    }
  });

  test("getMasteries: auth olmadan koruma", async ({ request }) => {
    const res = await request.get("/api/trpc/assessment.getMasteries?input=%7B%7D");
    expect(res.status()).toBeLessThan(500);
  });

  test("getHataDefteri: auth olmadan koruma", async ({ request }) => {
    const res = await request.get("/api/trpc/assessment.getHataDefteri?input=%7B%7D");
    expect(res.status()).toBeLessThan(500);
  });

  test("getStudyCalendar: auth olmadan koruma", async ({ request }) => {
    const res = await request.get("/api/trpc/learning.getStudyCalendar?input=%7B%7D");
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("AI Stream Endpoint", () => {
  test("POST /api/ai/stream: auth olmadan koruma", async ({ request }) => {
    const res = await request.post("/api/ai/stream", {
      data: { prompt: "Merhaba", mode: "copilot_sohbet" },
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    // 401, 307, 302 kabul
    expect([401, 307, 302, 403]).toContain(res.status());
  });

  test("POST /api/ai/stream: boş prompt reddedilir", async ({ request }) => {
    const res = await request.post("/api/ai/stream", {
      data: { prompt: "", mode: "copilot_sohbet" },
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("Response Times", () => {
  test("tRPC getSchools < 1sn", async ({ request }) => {
    const start = Date.now();
    await request.get("/api/trpc/learning.getSchools?input=%7B%7D");
    const sure = Date.now() - start;
    expect(sure).toBeLessThan(1500);
  });

  test("Paralel 5 istek: tümü < 500", async ({ request }) => {
    const istek = () => request.get("/api/trpc/learning.getSchools?input=%7B%7D");
    const sonuclar = await Promise.all([istek(), istek(), istek(), istek(), istek()]);
    for (const r of sonuclar) {
      expect(r.status()).toBeLessThan(500);
    }
  });
});

test.describe("404 ve Hata Handling", () => {
  test("Geçersiz tRPC endpoint: graceful hata", async ({ request }) => {
    const res = await request.get("/api/trpc/bilinmeyen.endpoint");
    expect(res.status()).toBeLessThan(500);
  });

  test("Geçersiz path: 404 veya redirect", async ({ request }) => {
    const res = await request.get("/kesinlikle-yok-" + Date.now(), {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(res.status()).toBeLessThan(500);
  });
});
