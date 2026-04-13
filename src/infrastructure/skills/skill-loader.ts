/**
 * Skill Yükleyici
 *
 * Hermes'in skill_utils.py parse_frontmatter() uyarlaması.
 * content/skills/{ders}/{slug}/SKILL.md dosyalarını yükler.
 */

import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const SKILLS_DIR = path.join(process.cwd(), "content/skills");

export interface TipikHata {
  tip: string;
  aciklama: string;
  cozum: string;
}

export interface SkillData {
  name: string;
  ders: string;
  description: string;
  kazanimlar: string[];
  zorlukDagilimi: { kolay: number; orta: number; zor: number };
  onkosuller: string[];
  lgsAgirlik: number;
  tipikHatalar: TipikHata[];
  icerik: string; // Markdown body
  seviyeAnlatimlari: {
    baslangic: string;
    orta: string;
    ileri: string;
  };
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[çÇ]/g, "c").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[ıİ]/g, "i")
    .replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-");
}

/**
 * Topic ismine göre skill dosyasını yükle
 */
export function loadSkillForTopic(topicIsim: string, ders: string): SkillData | null {
  const slug = normalize(topicIsim);
  const dersSlug = ders.toLowerCase();
  const skillPath = path.join(SKILLS_DIR, dersSlug, slug, "SKILL.md");

  if (!fs.existsSync(skillPath)) return null;

  try {
    const raw = fs.readFileSync(skillPath, "utf-8");
    const { data, content } = matter(raw);

    return {
      name: data.name ?? slug,
      ders: data.ders ?? ders,
      description: data.description ?? "",
      kazanimlar: data.kazanimlar ?? [],
      zorlukDagilimi: data.zorlukDagilimi ?? { kolay: 0.33, orta: 0.34, zor: 0.33 },
      onkosuller: data.onkosuller ?? [],
      lgsAgirlik: data.lgsAgirlik ?? 3,
      tipikHatalar: data.tipikHatalar ?? [],
      icerik: content,
      seviyeAnlatimlari: extractLevelContent(content),
    };
  } catch {
    return null;
  }
}

/**
 * Tüm mevcut skill'leri listele
 */
export function listAvailableSkills(): Array<{ ders: string; slug: string; path: string }> {
  const skills: Array<{ ders: string; slug: string; path: string }> = [];

  if (!fs.existsSync(SKILLS_DIR)) return skills;

  const dersler = fs.readdirSync(SKILLS_DIR);
  for (const ders of dersler) {
    const dersPath = path.join(SKILLS_DIR, ders);
    if (!fs.statSync(dersPath).isDirectory()) continue;

    const konular = fs.readdirSync(dersPath);
    for (const konu of konular) {
      const skillFile = path.join(dersPath, konu, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        skills.push({ ders, slug: konu, path: skillFile });
      }
    }
  }

  return skills;
}

/**
 * Markdown'dan seviye bazlı anlatımları çıkar
 */
function extractLevelContent(markdown: string): {
  baslangic: string;
  orta: string;
  ileri: string;
} {
  const result = { baslangic: "", orta: "", ileri: "" };

  const sections = markdown.split(/^##\s+/m);

  for (const section of sections) {
    const lower = section.toLowerCase();
    if (lower.startsWith("başlangıç") || lower.startsWith("baslangic")) {
      result.baslangic = section.replace(/^[^\n]+\n/, "").trim();
    } else if (lower.startsWith("orta")) {
      result.orta = section.replace(/^[^\n]+\n/, "").trim();
    } else if (lower.startsWith("ileri") || lower.startsWith("i̇leri")) {
      result.ileri = section.replace(/^[^\n]+\n/, "").trim();
    }
  }

  return result;
}

/**
 * Skill'i prompt'a uygun formata çevir
 */
export function buildSkillPromptContext(
  skill: SkillData,
  seviye: "baslangic" | "orta" | "ileri",
  hataEgilimi?: string | null
): string {
  const parts: string[] = [
    `--- KONU SKİLL REHBERİ: ${skill.name} ---`,
    skill.description,
    "",
  ];

  // Seviyeye uygun anlatım
  const anlatim = skill.seviyeAnlatimlari[seviye];
  if (anlatim) {
    parts.push(`[${seviye.toUpperCase()} SEVİYE ANLATIM]`);
    parts.push(anlatim);
    parts.push("");
  }

  // Tipik hatalar (öğrencinin eğilimine göre önceliklendir)
  if (skill.tipikHatalar.length > 0) {
    parts.push("[TİPİK HATALAR]");
    const sorted = [...skill.tipikHatalar].sort((a, b) => {
      if (a.tip === hataEgilimi) return -1;
      if (b.tip === hataEgilimi) return 1;
      return 0;
    });
    for (const hata of sorted) {
      parts.push(`- ${hata.tip}: ${hata.aciklama}`);
      parts.push(`  Çözüm: ${hata.cozum}`);
    }
    parts.push("");
  }

  parts.push("--- SKİLL REHBERİ SONU ---");
  return parts.join("\n");
}
