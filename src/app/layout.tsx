import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "../lib/trpc-provider";
// AI Koç Baloncuğu küresel düzen(layout)'dan tamamen kaldırıldı ve SidebarLayout içerisine taşındı.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LGS AI Kocu",
  description: "Yapay zeka destekli kisisellestirilmis LGS hazirlık platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
