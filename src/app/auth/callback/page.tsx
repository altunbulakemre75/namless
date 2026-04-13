"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../lib/trpc";

// Giris/kayit sonrasi: localStorage'daki diagnostic sonuclari DB'ye aktar
export default function AuthCallbackPage() {
  const router = useRouter();
  const [durum, setDurum] = useState("Yükleniyor...");
  const transferMutation = trpc.learning.transferDiagnostic.useMutation();

  useEffect(() => {
    const aktar = async () => {
      const raw = localStorage.getItem("lgs_diagnostic_result");
      if (raw) {
        try {
          setDurum("Deneme sonuçların aktarılıyor...");
          const data = JSON.parse(raw);
          await transferMutation.mutateAsync({ cevaplar: data.cevaplar });
          localStorage.removeItem("lgs_diagnostic_result");
          setDurum("Çalışma planın oluşturuldu! Yönlendiriliyorsun...");
        } catch (err) {
          console.error("Diagnostic transfer hatası:", err);
          setDurum("Plan oluşturulamadı, dashboard'a yönlendiriliyorsun...");
        }
      }
      setTimeout(() => router.push("/dashboard"), 1000);
    };
    aktar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{durum}</p>
      </div>
    </div>
  );
}
