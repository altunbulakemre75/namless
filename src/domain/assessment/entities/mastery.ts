// TURETILMIS VERI - Attempt'lerden her zaman yeniden hesaplanabilir
export interface Mastery {
  userId: string;
  topicId: string;
  skor: number; // 0-100
  guvenAraligi: number; // az veri ±20, cok veri ±5
  sonGuncelleme: Date;
  versiyon: number; // recompute icin
}
