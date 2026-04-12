import { Zorluk } from "./topic";

export enum QuestionKaynak {
  CIKMIS = "CIKMIS",
  AI_URETIM = "AI_URETIM",
  OGRETMEN = "OGRETMEN",
}

export enum ValidationStatus {
  DRAFT = "DRAFT",
  REVIEWED = "REVIEWED",
  PUBLISHED = "PUBLISHED",
  FLAGGED = "FLAGGED",
}

export interface Question {
  id: string;
  topicId: string;
  kaynak: QuestionKaynak;
  kaynakYili: number | null;
  zorluk: Zorluk;
  soruMetni: string;
  siklar: string[];
  dogruSik: number; // 0-3 index
  aciklama: string;
  aiModel: string | null;
  validationStatus: ValidationStatus;
  kullanimSayisi: number;
  dogrulukOrani: number;
}
