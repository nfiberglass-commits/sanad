"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { t, LANG_COOKIE, type Lang, type DictKey } from "@/lib/i18n";
import BrandMark from "@/components/BrandMark";

const LINKS: { href: string; key: DictKey }[] = [
  { href: "/dashboard", key: "nav_dashboard" },
  { href: "/profile", key: "nav_profile" },
  { href: "/roleplay", key: "nav_roleplay" },
  { href: "/speech", key: "nav_speech" },
  { href: "/sessions", key: "nav_sessions" },
  { href: "/data-sources", key: "nav_data" },
  { href: "/settings", key: "nav_settings" },
  { href: "/guide", key: "nav_guide" },
];

// Owner-only — hidden on every customer install.
const OWNER_LINK: { href: string; key: DictKey } = {
  href: "/business-model",
  key: "nav_business",
};

export default function Nav({
  lang,
  owner = false,
  demo = false,
}: {
  lang: Lang;
  owner?: boolean;
  demo?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/login" || pathname === "/setup") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function toggleLang() {
    const next = lang === "ar" ? "en" : "ar";
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <nav className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 h-12">
        <span className="me-2"><BrandMark lang={lang} /></span>
        {demo && (
          <span
            title={t(lang, "demo_badge_title")}
            className="me-3 shrink-0 rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-[0.68rem] font-semibold tracking-wide text-amber-800"
          >
            {t(lang, "demo_badge")}
          </span>
        )}
        {(owner ? [...LINKS, OWNER_LINK] : LINKS).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded text-sm ${
              pathname.startsWith(l.href)
                ? "bg-slate-200 text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t(lang, l.key)}
          </Link>
        ))}
        <button
          onClick={toggleLang}
          className="ms-auto text-sm font-medium text-emerald-700 hover:text-emerald-600 px-2 py-1"
          title={lang === "ar" ? "Switch to English" : "التحويل للعربية"}
        >
          {lang === "ar" ? "EN" : "عربي"}
        </button>
        <button
          onClick={logout}
          className="text-sm text-slate-500 hover:text-slate-900 px-2 py-1"
        >
          {t(lang, "logout")}
        </button>
      </div>
    </nav>
  );
}
