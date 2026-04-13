import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { prisma } from "../../infrastructure/database/prisma";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { rol: true, isim: true },
  });

  if (!dbUser || dbUser.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">LGS Admin</p>
          <p className="text-sm font-medium text-white">{dbUser.isim}</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            📊 İstatistikler
          </Link>
          <Link
            href="/admin/sorular"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            📝 Sorular
          </Link>
          <Link
            href="/admin/konular"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            📚 Konular
          </Link>
          <Link
            href="/admin/kullanicilar"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            👥 Kullanıcılar
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200">
            ← Öğrenci paneline dön
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
