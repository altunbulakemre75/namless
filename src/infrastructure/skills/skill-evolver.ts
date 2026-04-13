/**
 * Skill Evolver — Hermes SkillEvolver uyarlaması
 *
 * Attempt verilerinden öğrenilerek SKILL.md dosyalarını günceller.
 * Belirli aralıklarla (cron veya admin tetiklemesi) çalışır.
 *
 * Yapı:
 * - Konu için son 30 günlük attempt'ları analiz et
 * - En sık yapılan hataları çıkar
 * - Mevcut SKILL.md'deki tipikHatalar'ı güncelle
 * - Değişikliği dosyaya yaz (fs)
 *
 * Not: Bu sistem önce local dosyaları günceller.
 * Deploy'da: SKILL.md'ler git'te, script local çalışır → commit → deploy.
 */

import * as fs from "fs";
import * as path from "path";

export interface EvolveResult {
  topicIsim: string;
  ders: string;
  eskiHataSayisi: number;
  yeniHataSayisi: number;
  eklenenHatalar: string[];
  dosyaGuncellendi: boolean;
}

export interface AttemptSummary {
  soruMetni: string;
  secilenSik: number;
  dogruSik: number;
  dogruMu: boolean;
  hataKategorisi?: string | null;
}

/**
 * Attempt verilerinden en sık hataları çıkar
 */
export function extractTopErrors(
  attempts: AttemptSummary[],
  maxHata: number = 5,
): string[] {
  const yanlilar = attempts.filter((a) => !a.dogruMu);
  if (yanlilar.length === 0) return [];

  // Hata kategorilerini say
  const kategoriSayisi = new Map<string, number>();
  for (const a of yanlilar) {
    const kat = a.hataKategorisi ?? "BILINMIYOR";
    kategoriSayisi.set(kat, (kategoriSayisi.get(kat) ?? 0) + 1);
  }

  // Frekansa göre sırala
  const sirali = [...kategoriSayisi.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxHata)
    .map(([kat, sayi]) => {
      const oran = Math.round((sayi / yanlilar.length) * 100);
      return formatHataStr(kat, oran);
    });

  return sirali;
}

function formatHataStr(kategori: string, oran: number): string {
  const tanimlar: Record<string, string> = {
    KAVRAM_EKSIK: `Kavramsal anlayış eksikliği (%${oran} hata)`,
    DIKKATSIZLIK: `Dikkatsizlik/Okuma hatası (%${oran} hata)`,
    KONU_ATLAMA: `Konu atlama/boşluk (%${oran} hata)`,
    HESAP_HATASI: `Hesaplama hatası (%${oran} hata)`,
    ZAMAN_BASKISI: `Zaman baskısı kaynaklı hata (%${oran} hata)`,
    BILINMIYOR: `Kategorilendirilmemiş hata (%${oran} hata)`,
  };
  return tanimlar[kategori] ?? `${kategori} (%${oran} hata)`;
}

/**
 * SKILL.md dosyasını güncelle
 * Sadece tipikHatalar alanını değiştirir, geri kalan YAML'ı korur
 */
export function updateSkillFile(
  skillPath: string,
  yeniHatalar: string[],
): boolean {
  if (!fs.existsSync(skillPath)) return false;

  const icerik = fs.readFileSync(skillPath, "utf-8");

  // tipikHatalar bloğunu bul ve değiştir (YAML frontmatter içinde)
  const tipikHatalarRegex = /tipikHatalar:\s*\n((?:\s+-\s+.+\n?)*)/;
  const match = icerik.match(tipikHatalarRegex);

  if (!match) return false;

  const yeniYamlList = yeniHatalar.map((h) => `  - "${h}"`).join("\n");
  const yeniBlok = `tipikHatalar:\n${yeniYamlList}\n`;

  const guncelIcerik = icerik.replace(tipikHatalarRegex, yeniBlok);

  // Değişiklik yoksa yazma
  if (guncelIcerik === icerik) return false;

  fs.writeFileSync(skillPath, guncelIcerik, "utf-8");
  return true;
}

/**
 * Konu için skill dosya yolunu belirle
 */
export function getSkillPath(topicIsim: string, ders: string): string {
  const slug = topicIsim
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const dersSlug = ders.toLowerCase();

  return path.join(
    process.cwd(),
    "content",
    "skills",
    dersSlug,
    slug,
    "SKILL.md",
  );
}

/**
 * Tek konu için skill evrim
 */
export function evolveSkill(opts: {
  topicIsim: string;
  ders: string;
  attempts: AttemptSummary[];
}): EvolveResult {
  const skillPath = getSkillPath(opts.topicIsim, opts.ders);

  // Mevcut dosya yoksa boş sonuç
  if (!fs.existsSync(skillPath)) {
    return {
      topicIsim: opts.topicIsim,
      ders: opts.ders,
      eskiHataSayisi: 0,
      yeniHataSayisi: 0,
      eklenenHatalar: [],
      dosyaGuncellendi: false,
    };
  }

  // Mevcut hataları say
  const mevcutIcerik = fs.readFileSync(skillPath, "utf-8");
  const mevcutHataSayisi = (mevcutIcerik.match(/tipikHatalar:/))
    ? (mevcutIcerik.match(/\s+-\s+/g) ?? []).length
    : 0;

  // Yeni hataları çıkar
  const yeniHatalar = extractTopErrors(opts.attempts, 5);

  if (yeniHatalar.length === 0) {
    return {
      topicIsim: opts.topicIsim,
      ders: opts.ders,
      eskiHataSayisi: mevcutHataSayisi,
      yeniHataSayisi: mevcutHataSayisi,
      eklenenHatalar: [],
      dosyaGuncellendi: false,
    };
  }

  const guncellendi = updateSkillFile(skillPath, yeniHatalar);

  return {
    topicIsim: opts.topicIsim,
    ders: opts.ders,
    eskiHataSayisi: mevcutHataSayisi,
    yeniHataSayisi: yeniHatalar.length,
    eklenenHatalar: yeniHatalar,
    dosyaGuncellendi: guncellendi,
  };
}
