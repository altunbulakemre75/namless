"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { trpc } from "../../lib/trpc";
import SidebarLayout from "../components/SidebarLayout";
import {
  ChevronLeft, ChevronRight, Calendar, CheckCircle2,
  Circle, BookOpen, Zap, Clock, Target
} from "lucide-react";

const DERS_RENK: Record<string, string> = {
  MATEMATIK: "#6366f1", FEN: "#10b981", TURKCE: "#ef4444",
  SOSYAL: "#f97316", DIN: "#14b8a6", INGILIZCE: "#8b5cf6",
};

const DERS_KISA: Record<string, string> = {
  MATEMATIK: "Mat", FEN: "Fen", TURKCE: "Türk",
  SOSYAL: "Sos", DIN: "Din", INGILIZCE: "İng",
};

const AY_ISIM = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUN_ISIM = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface SessionKonu { id: string; isim: string; ders: string; }
interface Session {
  id: string;
  tarih: string;
  durum: string;
  tahminiSure: number;
  konular: SessionKonu[];
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function TakvimPage() {
  const bugun = new Date();
  const [gorulenAy, setGorulenAy] = useState(new Date(bugun.getFullYear(), bugun.getMonth(), 1));
  const [seciliGun, setSeciliGun] = useState<Date | null>(bugun);

  const { data, isLoading, refetch } = trpc.learning.getStudyCalendar.useQuery();
  const completeSession = trpc.learning.completeSession.useMutation({ onSuccess: () => refetch() });

  const sessions: Session[] = (data?.sessions ?? []).map((s: any) => ({
    ...s,
    tarih: typeof s.tarih === "string" ? s.tarih : s.tarih.toISOString(),
  }));

  // Takvim grid
  const ilkGun = new Date(gorulenAy.getFullYear(), gorulenAy.getMonth(), 1);
  const sonGun = new Date(gorulenAy.getFullYear(), gorulenAy.getMonth() + 1, 0);
  // Pazartesi başlangıç: ilkGün'ün haftanın kaçıncı günü (0=Pzt)
  const baslangicOffset = (ilkGun.getDay() + 6) % 7;
  const gunler: (Date | null)[] = [
    ...Array(baslangicOffset).fill(null),
    ...Array.from({ length: sonGun.getDate() }, (_, i) => new Date(gorulenAy.getFullYear(), gorulenAy.getMonth(), i + 1)),
  ];
  // 6 satır için tamamla
  while (gunler.length % 7 !== 0) gunler.push(null);

  const sessionMap = new Map<string, Session[]>();
  sessions.forEach((s) => {
    const key = new Date(s.tarih).toDateString();
    if (!sessionMap.has(key)) sessionMap.set(key, []);
    sessionMap.get(key)!.push(s);
  });

  const seciliGunSessions = seciliGun
    ? sessions.filter((s) => isSameDay(new Date(s.tarih), seciliGun))
    : [];

  const tamamlanan = sessions.filter((s) => s.durum === "DONE").length;
  const toplam = sessions.length;
  const lgs = new Date("2026-06-07");
  const kalanGun = Math.max(0, Math.ceil((lgs.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <SidebarLayout>
      <div className="px-4 md:px-8 py-8 max-w-[1100px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-squircle bg-violet-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Çalışma Takvimi</h1>
            <p className="text-sm text-foreground/50">LGS'ye {kalanGun} gün kaldı</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ios-card rounded-squircle h-24 animate-pulse" />
            ))}
          </div>
        ) : toplam === 0 ? (
          <div className="ios-card rounded-squircle-lg p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-foreground/20" />
            <h2 className="text-xl font-bold mb-2">Çalışma Planı Yok</h2>
            <p className="text-sm text-foreground/50 mb-6">
              Seviyeni belirle veya hedef okul seç — AI koçun sana özel bir plan hazırlasın.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/diagnostic" className="bg-[var(--ios-blue)] text-white px-6 py-3 rounded-squircle font-semibold text-sm">
                Seviye Testi
              </Link>
              <Link href="/hedef-okul" className="bg-foreground/5 px-6 py-3 rounded-squircle font-semibold text-sm">
                Hedef Okul Seç
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_340px] gap-6">
            {/* Sol: Takvim */}
            <div className="space-y-4">
              {/* Özet */}
              <div className="grid grid-cols-3 gap-3">
                <div className="ios-card rounded-squircle p-4 text-center">
                  <p className="text-2xl font-black text-violet-500">{tamamlanan}</p>
                  <p className="text-[10px] text-foreground/50 font-semibold uppercase tracking-widest mt-1">Tamamlandı</p>
                </div>
                <div className="ios-card rounded-squircle p-4 text-center">
                  <p className="text-2xl font-black">{toplam - tamamlanan}</p>
                  <p className="text-[10px] text-foreground/50 font-semibold uppercase tracking-widest mt-1">Bekliyor</p>
                </div>
                <div className="ios-card rounded-squircle p-4 text-center">
                  <p className="text-2xl font-black text-emerald-500">{data?.gunlukDakika ?? 60}</p>
                  <p className="text-[10px] text-foreground/50 font-semibold uppercase tracking-widest mt-1">Dk/Gün</p>
                </div>
              </div>

              {/* Takvim */}
              <div className="ios-card rounded-squircle-lg p-5">
                {/* Ay navigasyon */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => setGorulenAy(new Date(gorulenAy.getFullYear(), gorulenAy.getMonth() - 1, 1))}
                    className="w-8 h-8 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="font-bold text-base">
                    {AY_ISIM[gorulenAy.getMonth()]} {gorulenAy.getFullYear()}
                  </h2>
                  <button
                    onClick={() => setGorulenAy(new Date(gorulenAy.getFullYear(), gorulenAy.getMonth() + 1, 1))}
                    className="w-8 h-8 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Gün başlıkları */}
                <div className="grid grid-cols-7 mb-2">
                  {GUN_ISIM.map((g) => (
                    <div key={g} className="text-center text-[10px] font-bold text-foreground/40 uppercase tracking-widest py-1">
                      {g}
                    </div>
                  ))}
                </div>

                {/* Günler */}
                <div className="grid grid-cols-7 gap-y-1">
                  {gunler.map((gun, i) => {
                    if (!gun) return <div key={i} />;
                    const gunSessions = sessionMap.get(gun.toDateString()) ?? [];
                    const tamamlandimi = gunSessions.every((s) => s.durum === "DONE");
                    const vaSessions = gunSessions.length > 0;
                    const bugunmu = isSameDay(gun, bugun);
                    const lgsGunu = isSameDay(gun, lgs);
                    const secilimi = seciliGun && isSameDay(gun, seciliGun);
                    const dersRenkler = [...new Set(gunSessions.flatMap((s) => s.konular.map((k) => k.ders)))].slice(0, 3);

                    return (
                      <button
                        key={i}
                        onClick={() => setSeciliGun(gun)}
                        className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${
                          secilimi ? "bg-[var(--ios-blue)] text-white" :
                          bugunmu ? "ring-2 ring-[var(--ios-blue)]" :
                          "hover:bg-foreground/5"
                        } ${lgsGunu ? "ring-2 ring-red-500" : ""}`}
                      >
                        <span className={`text-sm font-semibold ${secilimi ? "text-white" : bugunmu ? "text-[var(--ios-blue)]" : ""}`}>
                          {gun.getDate()}
                        </span>
                        {vaSessions && (
                          <div className="flex gap-0.5 mt-0.5">
                            {tamamlandimi ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ) : (
                              dersRenkler.map((d, di) => (
                                <div key={di} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DERS_RENK[d] ?? "#94a3b8" }} />
                              ))
                            )}
                          </div>
                        )}
                        {lgsGunu && <span className="absolute -top-0.5 -right-0.5 text-[8px] bg-red-500 text-white rounded px-0.5 font-black">LGS</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-foreground/5">
                  <div className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tamamlandı
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Planlandı
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                    <div className="w-2.5 h-2.5 rounded-full ring-2 ring-[var(--ios-blue)]" /> Bugün
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ: Seçili gün detayı */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-foreground/50 uppercase tracking-widest">
                {seciliGun ? `${seciliGun.getDate()} ${AY_ISIM[seciliGun.getMonth()]}` : "Bir gün seçin"}
              </h3>

              {seciliGunSessions.length === 0 ? (
                <div className="ios-card rounded-squircle p-8 text-center text-foreground/40">
                  <Circle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Bu gün için plan yok</p>
                </div>
              ) : (
                seciliGunSessions.map((session) => {
                  const tamamlandi = session.durum === "DONE";
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`ios-card rounded-squircle p-5 ${tamamlandi ? "opacity-70" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {tamamlandi ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-foreground/30 shrink-0" />
                          )}
                          <span className={`text-sm font-bold ${tamamlandi ? "line-through text-foreground/50" : ""}`}>
                            {tamamlandi ? "Tamamlandı" : "Bekliyor"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] text-foreground/50 shrink-0">
                          <Clock className="w-3 h-3" />
                          {session.tahminiSure} dk
                        </div>
                      </div>

                      {session.konular.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {session.konular.map((k) => (
                            <div key={k.id} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DERS_RENK[k.ders] ?? "#94a3b8" }} />
                              <span className="text-[12px] text-foreground/70">{k.isim}</span>
                              <span className="text-[10px] text-foreground/30 ml-auto">{DERS_KISA[k.ders]}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!tamamlandi && (
                        <div className="flex gap-2 mt-3">
                          {session.konular[0] && (
                            <Link
                              href={`/calis?topicId=${session.konular[0].id}`}
                              className="flex-1 text-center text-[12px] font-semibold bg-[var(--ios-blue)] text-white py-2.5 rounded-xl"
                            >
                              Çalış
                            </Link>
                          )}
                          <button
                            onClick={() => completeSession.mutate({ sessionId: session.id })}
                            disabled={completeSession.isPending}
                            className="flex-1 text-center text-[12px] font-semibold bg-emerald-500/10 text-emerald-600 py-2.5 rounded-xl hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            Tamamlandı
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}

              {/* Bugünün özeti */}
              {seciliGun && isSameDay(seciliGun, bugun) && seciliGunSessions.length > 0 && (
                <div className="ios-card rounded-squircle p-4 bg-violet-500/5 border-none">
                  <p className="text-[11px] font-bold text-violet-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Bugün
                  </p>
                  <p className="text-sm text-foreground/70">
                    {seciliGunSessions.filter((s) => s.durum === "DONE").length}/{seciliGunSessions.length} oturum tamamlandı.
                    {seciliGunSessions.some((s) => s.durum === "PENDING") && " Devam etmek için konuya tıkla."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
