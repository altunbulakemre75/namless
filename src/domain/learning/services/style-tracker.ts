/**
 * Öğrenme Stili Etkinlik Ölçümü
 *
 * Anlatım stilinden ÖNCE ve SONRA mastery skorunu karşılaştırıp
 * hangi stilin en etkili olduğunu belirler.
 */

import { PrismaClient, OgrenmeStili } from "@prisma/client";

export async function updateStyleEffectiveness(
  prisma: PrismaClient,
  userId: string,
  topicId: string,
  stil: OgrenmeStili,
  oncekiMastery: number,
  sonrakiMastery: number
): Promise<void> {
  const fark = sonrakiMastery - oncekiMastery;

  // Sadece pozitif değişimleri değerlendir
  if (fark <= 0) return;

  const profil = await prisma.learningProfile.findUnique({
    where: { userId },
  });

  if (!profil) {
    // İlk kez — bu stili kaydet
    await prisma.learningProfile.create({
      data: {
        userId,
        enEtkiliStil: stil,
      },
    });
    return;
  }

  // Mevcut stil ile karşılaştır: eğer yeni stil daha iyi sonuç verdiyse güncelle
  // Basit heuristik: fark > 10 puan ise stili güncelle
  if (fark > 10 || !profil.enEtkiliStil) {
    await prisma.learningProfile.update({
      where: { userId },
      data: {
        enEtkiliStil: stil,
        sonGuncelleme: new Date(),
      },
    });
  }
}
