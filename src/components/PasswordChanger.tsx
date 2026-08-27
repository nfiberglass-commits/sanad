"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import { MIN_PASSWORD_LENGTH } from "@/lib/policy";

export default function PasswordChanger({ lang }: { lang: Lang }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setDone(false);
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(t(lang, "password_short"));
      return;
    }
    if (next !== confirm) {
      setError(t(lang, "password_mismatch"));
      return;
    }
    setBusy(true);
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      return;
    }
    setError(res.status === 401 ? t(lang, "wrong_current") : t(lang, "setup_failed"));
  }

  return (
    <div className="space-y-2">
      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder={t(lang, "current_password")}
        autoComplete="current-password"
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
      />
      <input
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        placeholder={t(lang, "password_new")}
        autoComplete="new-password"
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={t(lang, "password_confirm")}
        autoComplete="new-password"
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy || current.length === 0}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded px-4 py-1.5 text-sm"
        >
          {t(lang, "change_password")}
        </button>
        {done && <span className="text-xs text-emerald-700">{t(lang, "password_changed")}</span>}
      </div>
    </div>
  );
}
