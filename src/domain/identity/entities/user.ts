export enum UserRole {
  STUDENT = "STUDENT",
  PARENT = "PARENT",
  ADMIN = "ADMIN",
}

export enum SubscriptionTier {
  FREE = "FREE",
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
}

export interface User {
  id: string;
  email: string;
  telefon: string | null;
  rol: UserRole;
  isim: string;
  okulSinif: number | null; // 8. sinif
  parentId: string | null; // veli baglantisi
  subscriptionTier: SubscriptionTier;
  subscriptionEndDate: Date | null;
  olusturmaTarihi: Date;
}
