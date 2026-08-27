"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t as tr, type Lang } from "@/lib/i18n";

export default function PurgeButton({ lang }: { lang: Lang }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function purge() {
    setBusy(true);
    const res = await fetch("/api/data/purge", { method: "DELETE" });
    setBusy(false);
    setConfirming(false);
    if (res.ok) {
      const data = await res.json();
      setResult(
        `Wiped: ${data.deleted.messages} messages, ${data.deleted.profiles} profiles, ${data.deleted.sessions} sessions, ${data.deleted.rawFiles} raw files.`
      );
      router.refresh();
    } else {
      setResult("Purge failed.");
    }
  }

  return (
    <div className="space-y-2">
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="bg-red-600 hover:bg-red-500 text-white border border-red-700 rounded px-4 py-2 text-sm"
        >
          {tr(lang, "purge")}
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-red-600">
            {tr(lang, "purge_confirm")}
          </span>
          <button
            onClick={purge}
            disabled={busy}
            className="bg-red-600 hover:bg-red-500 text-white rounded px-3 py-1.5 text-sm"
          >
            {busy ? "…" : tr(lang, "purge_yes")}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="bg-slate-300 text-slate-900 rounded px-3 py-1.5 text-sm"
          >
            {tr(lang, "cancel")}
          </button>
        </div>
      )}
      {result && <p className="text-sm text-slate-600">{result}</p>}
    </div>
  );
}
