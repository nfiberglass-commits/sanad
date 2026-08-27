"use client";

import { useEffect } from "react";
import type { Lang } from "@/lib/i18n";

// The root layout renders lang/dir on <html> for the first paint, but those
// attributes can survive a client-side navigation while the page content
// re-renders — which shows English text laid out right-to-left. Sync them here
// so direction can never drift from the language actually on screen.
export default function HtmlDir({ lang }: { lang: Lang }) {
  useEffect(() => {
    const el = document.documentElement;
    const dir = lang === "ar" ? "rtl" : "ltr";
    if (el.dir !== dir) el.dir = dir;
    if (el.lang !== lang) el.lang = lang;
  }, [lang]);
  return null;
}
