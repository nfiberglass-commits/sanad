"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";
import BrandMark from "@/components/BrandMark";

export default function LoginForm({ lang }: { lang: Lang }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(t(lang, "login_wrong"));
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh]">
      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-xl p-8 w-full max-w-sm space-y-4"
      >
        <h1><BrandMark lang={lang} size="lg" /></h1>
        <p className="text-xs text-slate-500">{t(lang, "brand_tagline")}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{t(lang, "brand_description")}</p>
        <p className="text-sm text-slate-600">{t(lang, "login_tagline")}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t(lang, "login_placeholder")}
          autoFocus
          className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 rounded py-2 text-sm font-medium"
        >
          {busy ? "..." : t(lang, "login_enter")}
        </button>
      </form>
    </div>
  );
}
