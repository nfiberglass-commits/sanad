import { SCENARIOS } from "@/lib/scenarios";
import RoleplayChat from "@/components/RoleplayChat";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function RoleplayPage() {
  const lang = await getLang();
  const scenarios = SCENARIOS.map((s) => ({
    id: s.id,
    title: s.title,
    titleAr: s.titleAr,
    situation: s.situation,
    situationAr: s.situationAr,
    defaultDifficulty: s.defaultDifficulty,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t(lang, "roleplay_title")}</h1>
        <p className="text-sm text-slate-600 mt-1">{t(lang, "roleplay_tagline")}</p>
      </div>
      <RoleplayChat scenarios={scenarios} lang={lang} />
    </div>
  );
}
