export enum Ders {
  TURKCE = "TURKCE",
  MATEMATIK = "MATEMATIK",
  FEN = "FEN",
  SOSYAL = "SOSYAL",
  INGILIZCE = "INGILIZCE",
  DIN = "DIN",
}

export enum Zorluk {
  KOLAY = 1,
  ORTA = 2,
  ZOR = 3,
}

export interface Topic {
  id: string;
  parentId: string | null;
  ders: Ders;
  isim: string;
  mufredatYili: number;
  kazanimlar: string[]; // MEB kazanim kodlari
  onkosuller: string[]; // topic id'leri (DAG yapisi)
  zorlukProfili: { kolay: number; orta: number; zor: number };
  tarihselAgirlik: number; // son 5 yil kac soru cikti
}
