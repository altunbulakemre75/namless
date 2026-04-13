import { prisma } from "../../infrastructure/database/prisma";
import DiagnosticClient from "./diagnostic-client";

const GECERLI_DERSLER = ["MATEMATIK", "FEN", "TURKCE"];

interface Props {
  searchParams: Promise<{ ders?: string }>;
}

// Sunucuda sorular hazirlanip gelir — client beklemiyor
export default async function DiagnosticPage({ searchParams }: Props) {
  const params = await searchParams;
  const ders = params.ders && GECERLI_DERSLER.includes(params.ders) ? params.ders : null;
  const genelMod = params.ders === "genel";

  // Ders secilmemisse ve genel mod degilse → secim ekrani goster
  if (!ders && !genelMod) {
    return <DiagnosticClient sorular={[]} secilenDers={null} modSecim={true} />;
  }

  const where = {
    validationStatus: "PUBLISHED" as const,
    ...(ders ? { topic: { ders: ders as "MATEMATIK" | "FEN" | "TURKCE" | "SOSYAL" | "INGILIZCE" | "DIN" } } : {}),
  };

  const tumSorular = await prisma.question.findMany({
    where,
    include: { topic: true },
    orderBy: { kullanimSayisi: "asc" },
  });

  // Ders bazinda dengeli dagilim
  const dersGruplari = new Map<string, typeof tumSorular>();
  tumSorular.forEach((q) => {
    const d = q.topic.ders;
    if (!dersGruplari.has(d)) dersGruplari.set(d, []);
    dersGruplari.get(d)!.push(q);
  });

  const secilen: typeof tumSorular = [];
  // Genel modda her dersten 2 soru (3 ders × 2 = 6), tek ders modunda 20
  const maxPerDers = ders ? 20 : 2;

  dersGruplari.forEach((sorular) => {
    const karistir = [...sorular].sort(() => Math.random() - 0.5);
    secilen.push(...karistir.slice(0, maxPerDers));
  });

  const sorular = secilen.sort(() => Math.random() - 0.5).map((q) => ({
    id: q.id,
    ders: q.topic.ders,
    konuIsim: q.topic.isim,
    soruMetni: q.soruMetni,
    siklar: q.siklar,
    dogruSik: q.dogruSik,
    aciklama: q.aciklama,
    zorluk: q.zorluk,
  }));

  return <DiagnosticClient sorular={sorular} secilenDers={ders} modSecim={false} />;
}
