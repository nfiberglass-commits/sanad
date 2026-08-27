import PurgeButton from "@/components/PurgeButton";
import ModelPicker from "@/components/ModelPicker";
import VocabManager from "@/components/VocabManager";
import AliasEditor from "@/components/AliasEditor";
import PasswordChanger from "@/components/PasswordChanger";
import { currentModel, MODELS, readAppSettings, selfAliases } from "@/lib/settings";
import { maskLicenceKey } from "@/lib/licence";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const lang = await getLang();
  const settings = readAppSettings();
  const apiKeySet = Boolean(process.env.ANTHROPIC_API_KEY);
  const aliases = selfAliases();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t(lang, "settings_title")}</h1>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
        <h2 className="font-medium text-emerald-700">{t(lang, "config_title")}</h2>
        <div className="flex justify-between items-center gap-4 border-b border-slate-200 pb-2">
          <span className="text-slate-500">{t(lang, "api_key")}</span>
          <span className={apiKeySet ? "text-slate-800" : "text-red-600"}>
            {apiKeySet ? t(lang, "key_set") : t(lang, "key_missing")}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4 border-b border-slate-200 pb-2">
          <span className="text-slate-500">{t(lang, "model")}</span>
          <ModelPicker
            current={currentModel()}
            models={MODELS.map((m) => ({ id: m.id, label: m.label }))}
            lang={lang}
          />
        </div>
        {settings.displayName && (
          <div className="flex justify-between items-center gap-4 border-b border-slate-200 pb-2">
            <span className="text-slate-500">{t(lang, "your_name")}</span>
            <span dir="auto" className="text-slate-800">
              {settings.displayName}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center gap-4">
          <span className="text-slate-500">{t(lang, "licence")}</span>
          <span dir="ltr" className={settings.licenceKey ? "text-slate-800 font-mono" : "text-red-600"}>
            {settings.licenceKey ? maskLicenceKey(settings.licenceKey) : t(lang, "none_set")}
          </span>
        </div>
        <p className="text-xs text-slate-500">{t(lang, "licence_note")}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-medium text-emerald-700 text-sm">{t(lang, "self_aliases")}</h2>
        <AliasEditor lang={lang} initial={aliases} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-medium text-emerald-700 text-sm">{t(lang, "step_password")}</h2>
        <PasswordChanger lang={lang} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-medium text-emerald-700 text-sm">
          {lang === "ar" ? "مصطلحاتك وأسماء فريقك" : "Your vocabulary & team names"}
        </h2>
        <VocabManager lang={lang} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-medium text-emerald-700 text-sm">{t(lang, "privacy")}</h2>
        <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
          <li>{t(lang, "privacy_1")}</li>
          <li>{t(lang, "privacy_2")}</li>
          <li>{t(lang, "privacy_3")}</li>
        </ul>
        <PurgeButton lang={lang} />
      </div>
    </div>
  );
}
