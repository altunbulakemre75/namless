export enum AttemptBaglam {
  DIAGNOSTIC = "DIAGNOSTIC",
  DAILY = "DAILY",
  REVIEW = "REVIEW",
  MOCK_EXAM = "MOCK_EXAM",
}

// EVENT - degismez! Asla guncellenmez.
export interface Attempt {
  id: string;
  userId: string;
  questionId: string;
  secilenSik: number;
  dogruMu: boolean;
  sureMs: number;
  tarih: Date;
  baglam: AttemptBaglam;
}
