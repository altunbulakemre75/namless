"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, PenTool, Target, BookX, Users, Play, School, Award, LogOut, CalendarDays } from "lucide-react";
import KocBaloncugu from "./KocBaloncugu";

interface NavItem {
  href: string | null;
  icon: any;
  label: string;
  badge?: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard",    icon: Home,     label: "Ana Sayfa"    },
  { href: "/konular",      icon: BookOpen, label: "Konular"      },
  { href: "/calis",        icon: Play,     label: "Çalış"        },
  { href: "/deneme",       icon: PenTool,      label: "Deneme"       },
  { href: "/takvim",       icon: CalendarDays, label: "Takvim"       },
  { href: "/hata-defteri", icon: BookX,        label: "Hata Defteri" },
  { href: "/lgs-tahmin",   icon: Target,   label: "Puan Tahmini" },
  { href: "/hedef-okul",   icon: School,   label: "Hedef Okul"   },
  { href: "/veli",         icon: Users,    label: "Veli Paneli"  },
  { href: null, icon: Award, label: "Rozetler", badge: "Yakında" },
];

interface Props {
  children: React.ReactNode;
  userName?: string;
  onLogout?: () => void;
}

export default function SidebarLayout({ children, userName, onLogout }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-violet-500 selection:text-white">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col w-72 bg-foreground/5 border-r border-foreground/10 fixed inset-y-0 left-0 z-30 isolate backdrop-blur-3xl">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-violet-500/10 to-transparent -z-10 pointer-events-none" />
        
        {/* Logo */}
        <div className="flex items-center gap-4 px-6 py-8">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-white font-black text-sm tracking-tight">LGS</span>
          </div>
          <div>
            <p className="font-bold text-lg leading-tight tracking-tight">AI Koçu</p>
            <p className="text-xs text-foreground/50 mt-0.5">8. Sınıf Hazırlık</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2">
          {NAV.map((item, i) => {
            const Icon = item.icon;
            if (!item.href) {
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-foreground/30 cursor-not-allowed select-none group"
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium flex-1 group-hover:text-foreground/40 transition-colors">{item.label}</span>
                  <span className="text-[10px] bg-foreground/10 px-2 py-0.5 rounded border border-foreground/5 font-semibold tracking-wide uppercase">
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
                className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium group ${
                  active
                    ? "text-white shadow-md"
                    : "text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                {active && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 shrink-0 transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <KocBaloncugu />

        {/* User panel */}
        <div className="p-4 border-t border-foreground/10 bg-background/50">
          <Link
            href="/profil"
            className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-foreground/5 cursor-pointer transition-all border border-transparent hover:border-foreground/10 group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-white text-sm font-bold shadow-sm">
                {(userName ?? "Ö").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-violet-400 transition-colors">{userName ?? "Öğrenci"}</p>
              <p className="text-xs text-foreground/50">Profili görüntüle</p>
            </div>
            {onLogout && (
              <button
                onClick={(e) => { e.preventDefault(); onLogout(); }}
                className="text-foreground/40 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-500/10"
                title="Çıkış yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </Link>
        </div>
      </aside>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 glass border-t border-foreground/10 z-50 flex shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
        {NAV.filter((n) => n.href).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href!}
              href={item.href!}
              className={`flex-1 flex flex-col items-center gap-1.5 pt-3 pb-4 transition-colors relative ${
                active ? "text-violet-600 dark:text-violet-400" : "text-foreground/50"
              }`}
            >
              {active && (
                <motion.div 
                  layoutId="mobileActive" 
                  className="absolute top-0 inset-x-4 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-b-full"
                />
              )}
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ─── Main content ─── */}
      <main className="flex-1 md:ml-72 min-h-screen flex flex-col pb-20 md:pb-0 relative pt-4 md:pt-0">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none mix-blend-overlay" />
        {children}
      </main>

      <div className="md:hidden">
        <KocBaloncugu variant="floating" />
      </div>
    </div>
  );
}
