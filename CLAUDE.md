@AGENTS.md

# Proje: LGS AI Koçu

8. sınıf öğrencileri için kişiselleştirilmiş LGS hazırlık platformu.
Stack: Next.js 16 (App Router) · tRPC v11 · Prisma v5 · Supabase PostgreSQL · Tailwind CSS

---

## Naming Conventions

**Türkçe alan isimleri** — DB ve iş mantığı katmanında Türkçe kullanılır, bu kasıtlı bir karardır:
- `isim`, `ders`, `skor`, `tarih`, `anlatim` — değiştirme
- Enum değerleri büyük harf: `MATEMATIK`, `FEN`, `TURKCE`, `SOSYAL`, `INGILIZCE`, `DIN`
- tRPC endpoint adları Türkçe camelCase: `getKonuAnlatim`, `kaydetCevap`
- React component prop'ları İngilizce kalabilir (`userId`, `className`)

**Dosya yapısı:**
- Rotalar: `src/app/(student)/` ve `src/app/(admin)/` layout grupları
- Sunucu mantığı: `src/server/routers/` (tRPC)
- Domain katmanı: `src/domain/` (pure business logic, framework bağımsız)
- Altyapı: `src/infrastructure/` (Prisma, Claude provider)

---

## AI Model Seçimi

| Görev | Model |
|-------|-------|
| Konu anlatımı üretimi | `claude-sonnet-4-5-20241022` |
| PDF Vision / OCR | `claude-sonnet-4-5-20241022` |
| Soru açıklaması (aciklama) | `claude-haiku-4-5-20241022` |
| Admin soru üretimi | `claude-sonnet-4-5-20241022` |

Opus kullanma — Sonnet yeterli ve 10x daha ucuz.

---

## Kritik İş Kuralları

- **Mastery skoru** 0-100 arası float; `guvenAraligi` ile birlikte saklanır
- **Attempt tablosu immutable** — hiçbir zaman güncelleme, sadece INSERT
- **Topic hiyerarşisi**: Ders → Ünite → Konu (3 seviye, `parentId` ile)
- **Adaptive soru seçimi**: mastery skoru + zorluk eşleşmesi + son 30 gün history
- **LGS tarihi**: 7 Haziran 2026 (sabit, her yerde `new Date("2026-06-07")`)
- **Aktif dersler**: MATEMATIK, FEN, TURKCE (dashboard ve mastery hesabı için)

---

## Güvenlik Kuralları

- `test-system` route: production'da `ALLOW_TEST_ROUTE=1` env yoksa 403 döner
- `.env` ve `.env.local` asla commit edilmez (`.gitignore`'da)
- tRPC `protectedProcedure` — auth gereken endpoint'lerde zorunlu
- Supabase RLS aktif olmalı (service_role key yalnızca server-side scripts'te)

---

## Script'ler

```bash
# Kitap bilgi tabanı oluştur (bir kez çalıştır)
npx tsx scripts/kitap-isle.ts --test 8matcalisma.pdf   # test
npx tsx scripts/kitap-isle.ts                           # tümü

# Konu anlatımı üret
npx tsx scripts/anlatim-uret.ts --ders MATEMATIK --limit 5
npx tsx scripts/anlatim-uret.ts

# DB sync
npx prisma db push
npx prisma generate

# Konu listesi
npx tsx scripts/upload-ve-isle.ts --list-topics
```

PDF'ler: `C:\Users\altun\Desktop\mebkitaplar\`
Config: `config/kitap-map.json` (dosya → ders eşlemesi)

---

## Deploy (Vercel)

- `vercel.json` konfigürasyonu mevcut
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL` Vercel env'e eklenecek
- `ANTHROPIC_API_KEY` yalnızca server-side (NEXT_PUBLIC_ prefix'i olmadan)
- Script'ler Vercel'de çalışmaz — local'den çalıştır

---

## Geliştirme İlkeleri (Karpathy-style)

1. **Basit tut** — Tek sorumluluk. Her fonksiyon bir iş yapar, test edilebilir olsun.
2. **Kademeli geliştir** — Her PR çalışan bir şey ekler. Broken state'de commit yok.
3. **Hata mesajları birinci sınıf** — Belirsiz "bir hata oluştu" yok; kullanıcı ne yapacağını bilmeli.
4. **AI fallback her zaman var** — API key yoksa, rate limit varsa, timeout'ta → deterministik fallback döner, asla crash olmaz.

---

## Geliştirme Notları

- `prisma generate` çalıştırmadan yeni schema alanları `as any` cast gerektirir
- `getProfile` → `targetSchool` graceful fallback var (schools tablosu yoksa null döner)
- Tüm zaman hesaplamaları UTC; LGS gün sayısı `Math.ceil` ile yuvarlanır
