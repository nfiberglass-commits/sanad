import { readFileSync } from "fs";
import path from "path";
import { getLang } from "@/lib/lang-server";
import { mdToHtml } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const lang = await getLang();
  const file = lang === "ar" ? "Connect-WhatsApp-Guide-AR.md" : "Connect-WhatsApp-Guide-EN.md";
  let html = "";
  try {
    const md = readFileSync(path.join(process.cwd(), "docs", file), "utf-8");
    html = mdToHtml(md);
  } catch {
    html = "<p>Guide file not found in docs/.</p>";
  }
  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-800"
      dir={lang === "ar" ? "rtl" : "ltr"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
