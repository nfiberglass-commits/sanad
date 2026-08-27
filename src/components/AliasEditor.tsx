"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export default function AliasEditor({
  lang,
  initial,
}: {
  lang: Lang;
  initial: string[];
}) {
  const [value, setValue] = useState(initial.join("\n"));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/settings/aliases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aliases: value }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      return;
    }
    setError(t(lang, "names_required"));
  }

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        rows={4}
        dir="auto"
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
      />
      <p className="text-xs text-slate-500">{t(lang, "aliases_edit_help")}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded px-4 py-1.5 text-sm"
        >
          {t(lang, "save")}
        </button>
        {saved && <span className="text-xs text-emerald-700">{t(lang, "saved")}</span>}
      </div>
    </div>
  );
}
