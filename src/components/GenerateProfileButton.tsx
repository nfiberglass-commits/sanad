"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

export default function GenerateProfileButton({
  hasData,
  lang,
}: {
  hasData: boolean;
  lang: Lang;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function generate() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/analyze/profile", { method: "POST" });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Profile generation failed");
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={busy || !hasData}
        className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 rounded px-4 py-2 text-sm font-medium"
      >
        {busy ? t(lang, "analyzing") : t(lang, "generate_profile")}
      </button>
      {!hasData && <p className="text-xs text-slate-500">{t(lang, "need_more_data")}</p>}
      {error && <p className="text-sm text-red-600" dir="auto">{error}</p>}
    </div>
  );
}
