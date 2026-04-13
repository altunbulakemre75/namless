---
name: uslu-ifadeler
ders: MATEMATIK
description: 8. sınıf üslü ifadeler konusu — üs kuralları, negatif üs, sıfırıncı kuvvet
kazanimlar: ["M.8.1.2.1", "M.8.1.2.2", "M.8.1.2.3"]
zorlukDagilimi: { kolay: 0.3, orta: 0.4, zor: 0.3 }
onkosuller: ["carpanlar-ve-katlar"]
lgsAgirlik: 4
tipikHatalar:
  - tip: "KAVRAM_EKSIK"
    aciklama: "Negatif üsün anlamını bilmiyor — a^(-n) = 1/a^n kuralı"
    cozum: "Önce pozitif üsü somut örnekle göster, sonra 'ters çevirme' mantığını anlat"
  - tip: "DIKKATSIZLIK"
    aciklama: "Üs toplarken tabanları kontrol etmiyor"
    cozum: "Her adımda tabanların aynı olup olmadığını kontrol ettir"
  - tip: "KONU_ATLAMA"
    aciklama: "Üs içinde üs kuralını karıştırıyor — (a^m)^n = a^(m×n)"
    cozum: "Parantez içi ve dışı ayrımını vurgula"
---

# Üslü İfadeler — Öğretim Kılavuzu

## Temel Kurallar
1. a^m × a^n = a^(m+n) — tabanlar aynıysa üsleri topla
2. a^m ÷ a^n = a^(m-n) — tabanlar aynıysa üsleri çıkar
3. (a^m)^n = a^(m×n) — üs içinde üs varsa çarp
4. a^0 = 1 — sıfırıncı kuvvet her zaman 1 (a≠0)
5. a^(-n) = 1/a^n — negatif üs = tersi

## Başlangıç Seviyesi Anlatım
2^3 demek 2'yi 3 kere kendisiyle çarpmak: 2×2×2 = 8.
Bunu bir katlama gibi düşün — kağıdı 3 kere katlasan 8 katman olur.

Negatif üs? Tam tersi! 2^(-3) = 1/(2^3) = 1/8.
Yani "üs negatifse kesre çevir" kuralını hatırla.

## Orta Seviye Anlatım
Tabanları aynı olan üslü sayıları çarparken üsler toplanır
çünkü çarpma sayısını birleştiriyoruz: 2^3 × 2^4 = 2^7.

Dikkat: (2^3)^4 = 2^12 (üsler çarpılır), ama 2^3 × 2^4 = 2^7 (üsler toplanır).
Parantez var → çarp. Parantez yok, çarpım → topla.

## İleri Seviye Anlatım
LGS'de üslü ifadeler soruları genellikle 4=2², 8=2³, 27=3³
gibi dönüşümlerle başlar. Önce tüm sayıları aynı tabana çevir.

Tuzak: 2^10 ile 4^5 — aslında eşitler çünkü 4^5 = (2^2)^5 = 2^10.
Karşılaştırmalarda hep aynı tabana indirge!

## Sık Çıkan Soru Tipleri
1. Tüm sayıları aynı tabana çevirme: (4^3 × 8^2) / 2^5
2. Negatif üs ile işlem: 2^(-3) × 2^5
3. Üs karşılaştırma: 2^10 ile 4^5 hangisi büyük?
