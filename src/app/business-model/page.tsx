import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { getLang } from "@/lib/lang-server";
import { isOwner } from "@/lib/settings";
import { mdToHtml } from "@/lib/markdown";

export const dynamic = "force-dynamic";

// Owner-only page. A customer install has ownerMode unset, so this route 404s
// there — the wizard never writes the flag.
export default async function BusinessModelPage() {
  if (!isOwner()) notFound();

  const lang = await getLang();
  const file = lang === "ar" ? "Business-Model-AR.md" : "Business-Model-EN.md";
  let html = "";
  try {
    const md = readFileSync(path.join(process.cwd(), "docs", file), "utf-8");
    html = mdToHtml(md);
  } catch {
    html = `<p>${file} not found in docs/.</p>`;
  }

  return (
    <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900">
        {lang === "ar"
          ? "الصفحة دي في نسختك إنت بس — مش بتظهر عند أي عميل."
          : "This page exists in your copy only — no customer install shows it."}
      </div>
      <div
        className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
