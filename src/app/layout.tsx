import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Nav from "@/components/Nav";
import HtmlDir from "@/components/HtmlDir";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n";
import { isOwner, isDemo } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanad | سَنَد",
  description: "Sanad — A professional mentor that helps managers and employees discover their strengths, build their skills, and improve how they perform at work. من الوعي بالذات إلى التميز المهني",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const store = await cookies();
  const lang = normalizeLang(store.get(LANG_COOKIE)?.value);
  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900">
        <HtmlDir lang={lang} />
        <Nav lang={lang} owner={isOwner()} demo={isDemo()} />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
