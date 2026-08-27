"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, LANG_COOKIE, type Lang } from "@/lib/i18n";
import BrandMark from "@/components/BrandMark";
import { isValidLicenceFormat, normalizeLicenceKey, LICENCE_PLACEHOLDER } from "@/lib/licence";
import { MIN_PASSWORD_LENGTH } from "@/lib/policy";

const STEPS = 3; // licence -> names -> password, then the done card

// Arabic copy in this app uses Arabic-Indic digits — "خطوة 1 من 3" reads wrong.
function digits(n: number, lang: Lang): string {
  if (lang !== "ar") return String(n);
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export default function SetupWizard({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [licenceKey, setLicenceKey] = useState("");
  const [aliases, setAliases] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function toggleLang() {
    const nextLang = lang === "ar" ? "en" : "ar";
    document.cookie = LANG_COOKIE + "=" + nextLang + "; path=/; max-age=" + 60 * 60 * 24 * 365;
    router.refresh();
  }

  function goNext() {
    setError(null);
    if (step === 1) {
      if (!isValidLicenceFormat(licenceKey)) {
        setError(t(lang, "licence_bad"));
        return;
      }
      setLicenceKey(normalizeLicenceKey(licenceKey));
      setStep(2);
      return;
    }
    if (step === 2) {
      if (aliases.split(/[,\n]/).every((s) => !s.trim())) {
        setError(t(lang, "names_required"));
        return;
      }
      setStep(3);
      return;
    }
    void submit();
  }

  async function submit() {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t(lang, "password_short"));
      return;
    }
    if (password !== confirm) {
      setError(t(lang, "password_mismatch"));
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenceKey, displayName, aliases, password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t(lang, "setup_failed"));
      return;
    }
    // No router.refresh() here: /setup now redirects to /dashboard on the
    // server, so refreshing would skip the final upload prompt.
    setDone(true);
  }

  if (done) {
    // No language toggle here — switching it refreshes, and /setup redirects
    // away once setup is complete.
    return (
      <Card lang={lang}>
        <h2 className="text-lg font-semibold text-emerald-700">{t(lang, "setup_done_title")}</h2>
        <p className="text-sm text-slate-600">{t(lang, "setup_done_body")}</p>
        <button
          onClick={() => router.push("/data-sources")}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded py-2 text-sm font-medium"
        >
          {t(lang, "setup_done_cta")}
        </button>
      </Card>
    );
  }

  return (
    <Card lang={lang} onToggleLang={toggleLang}>
      <p className="text-sm text-slate-600">{t(lang, "setup_intro")}</p>
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={
              "h-1.5 flex-1 rounded " + (n <= step ? "bg-emerald-500" : "bg-slate-200")
            }
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {t(lang, "setup_step")} {digits(step, lang)} {t(lang, "setup_of")} {digits(STEPS, lang)}
      </p>

      {step === 1 && (
        <div className="space-y-2">
          <h2 className="font-medium text-slate-800">{t(lang, "step_licence")}</h2>
          <p className="text-xs text-slate-500">{t(lang, "licence_help")}</p>
          <input
            value={licenceKey}
            onChange={(e) => setLicenceKey(e.target.value)}
            placeholder={LICENCE_PLACEHOLDER}
            dir="ltr"
            autoFocus
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono tracking-wider uppercase focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="font-medium text-slate-800">{t(lang, "step_names")}</h2>
          <p className="text-xs text-slate-500">{t(lang, "names_help")}</p>
          <textarea
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            placeholder={t(lang, "names_placeholder")}
            rows={5}
            dir="auto"
            autoFocus
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
          <label className="block text-xs text-slate-500">
            {t(lang, "display_name")}
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              dir="auto"
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h2 className="font-medium text-slate-800">{t(lang, "step_password")}</h2>
          <p className="text-xs text-slate-500">{t(lang, "password_help")}</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(lang, "password_new")}
            autoFocus
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t(lang, "password_confirm")}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        {step > 1 && (
          <button
            onClick={() => {
              setError(null);
              setStep(step - 1);
            }}
            className="text-sm text-slate-500 hover:text-slate-900 px-3 py-2"
          >
            {t(lang, "setup_back")}
          </button>
        )}
        <button
          onClick={goNext}
          disabled={busy}
          className="ms-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded px-5 py-2 text-sm font-medium"
        >
          {busy
            ? t(lang, "setup_saving")
            : step === STEPS
              ? t(lang, "setup_finish")
              : t(lang, "setup_next")}
        </button>
      </div>
    </Card>
  );
}

function Card({
  lang,
  onToggleLang,
  children,
}: {
  lang: Lang;
  onToggleLang?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh]">
      <div className="bg-white border border-slate-200 rounded-xl p-8 w-full max-w-md space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <BrandMark lang={lang} />
            <h1 className="mt-3 text-xl font-semibold text-emerald-700">{t(lang, "setup_welcome")}</h1>
            <p className="text-xs text-slate-500">{t(lang, "brand_tagline")}</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {t(lang, "brand_description")}
            </p>
          </div>
          {onToggleLang && (
            <button
              onClick={onToggleLang}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-600 shrink-0"
            >
              {lang === "ar" ? "EN" : "عربي"}
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
