import { prisma } from "@/lib/db";
import UploadForm from "@/components/UploadForm";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DataSourcesPage() {
  const lang = await getLang();
  const [total, self, byLang] = await Promise.all([
    prisma.message.count(),
    prisma.message.count({ where: { author: "self" } }),
    prisma.message.groupBy({ by: ["lang"], _count: { _all: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t(lang, "data_title")}</h1>
        <p className="text-sm text-slate-600 mt-1">{t(lang, "data_tagline")}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">{t(lang, "total_messages")}</p>
          <p className="text-xl font-semibold mt-1">{total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">{t(lang, "written_by_you")}</p>
          <p className="text-xl font-semibold mt-1">{self}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">{t(lang, "languages")}</p>
          <p className="text-sm font-medium mt-2">
            {byLang.map((l) => `${l.lang}: ${l._count._all}`).join(" · ") || "—"}
          </p>
        </div>
      </div>

      <UploadForm lang={lang} />

      <div className="text-xs text-slate-500 space-y-1">
        <p>{t(lang, "coming_later")}</p>
      </div>
    </div>
  );
}
