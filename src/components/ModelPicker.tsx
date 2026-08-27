"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface ModelOption {
  id: string;
  label: string;
}

export default function ModelPicker({
  current,
  models,
  lang,
}: {
  current: string;
  models: ModelOption[];
  lang: Lang;
}) {
  const [model, setModel] = useState(current);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    setModel(next);
    setBusy(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: next }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={model}
        onChange={(e) => change(e.target.value)}
        disabled={busy}
        className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      {saved && <span className="text-xs text-emerald-700">{t(lang, "saved")}</span>}
    </div>
  );
}
