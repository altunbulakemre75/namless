"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string | null;
  icon: string;
  label: string;
  badge?: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard", icon: "🏠", label: "Ana Sayfa" },
  { href: "/konular",   icon: "📚", label: "Konular"   },
  { href: "/deneme",    icon: "📝", label: "Deneme"    },
  { href: null, icon: "📊", label: "İstatistikler", badge: "Yakında" },
  { href: null, icon: "🏆", label: "Rozetler",      badge: "Yakında" },
  { href: null, icon: "⚙️", label: "Ayarlar",       badge: "Yakında" },
];

interface Props {
  children: React.ReactNode;
  userName?: string;
  onLogout?: () => void;
}

export default function SidebarLayout({ children, userName, onLogout }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 shadow-sm fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-sm">LGS</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">AI Koçu</p>
            <p className="text-[11px] text-gray-400">8. Sınıf Hazırlık</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {NAV.map((item, i) => {
            if (!item.href) {
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-300 cursor-not-allowed select-none"
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md font-semibold tracking-wide">
                    Yakında
                  </span>
                </div>
              );
            }
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 font-medium ${
                  active
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-slate-50 hover:text-gray-900"
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User panel */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-violet-700 text-sm font-bold">
                {(userName ?? "Ö").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{userName ?? "Öğrenci"}</p>
              <p className="text-[11px] text-gray-400">8. Sınıf</p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1"
                title="Çıkış yap"
              >
                ↪
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30 flex shadow-lg">
        {NAV.filter((n) => n.href).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href!}
              href={item.href!}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                active ? "text-violet-600" : "text-gray-400"
              }`}
            >
              <span className="text-[22px] leading-none">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ─── Main content ─── */}
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
}
