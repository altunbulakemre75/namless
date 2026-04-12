export enum SessionDurum {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  DONE = "DONE",
}

export interface DailySession {
  tarih: Date;
  hedefTopicIds: string[];
  tahminiSure: number; // dakika
  durum: SessionDurum;
  gercekAttemptIds: string[];
}

export interface StudyPlan {
  id: string;
  userId: string;
  hedefTarih: Date; // LGS tarihi
  gunlukDakika: number;
  planVersiyonu: number;
  sessions: DailySession[];
  olusturmaTarihi: Date;
}
