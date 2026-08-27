"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

interface Term {
  id: string;
  term: string;
  kind: string;
  source: string;
}

interface Correction {
  id: string;
  wrong: string;
  right: string;
  count: number;
}

export default function VocabManager({ lang }: { lang: Lang }) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [input, setInput] = useState("");
  const [kind, setKind] = useState("person");
  const [busy, setBusy] = useState(false);

  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);

  async function load() {
    const res = await fetch("/api/vocab");
    if (!res.ok) return;
    const data = await res.json();
    setTerms(data.terms ?? []);
    setCorrections(data.corrections ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    if (input.trim().length < 2) return;
    setBusy(true);
    await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms: input, kind }),
    });
    setInput("");
    setBusy(false);
    void load();
  }

  async function remove(id: string) {
    await fetch("/api/vocab", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    void load();
  }

  const KINDS: [string, string, string][] = [
    ["person", "أسماء أشخاص", "People"],
    ["product", "منتجات", "Products"],
    ["place", "أماكن ومواقع", "Places"],
    ["term", "مصطلحات شغل", "Work terms"],
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {L(
          "Add the names and words you actually say — your team, products, sites. The speech model will expect them instead of guessing similar-sounding words.",
          "ضيف الأسماء والكلمات اللي بتقولها فعلًا — فريقك، منتجاتك، مواقعك. موديل الصوت هيتوقعها بدل ما يخمّن كلمة شبهها.",
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        {KINDS.map(([k, ar, en]) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`px-3 py-1 rounded-full text-xs border ${
              kind === k
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-600 border-slate-300"
            }`}
          >
            {lang === "ar" ? ar : en}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          dir="auto"
          placeholder={L(
            "e.g. a colleague's name, a product, a site — separate with commas",
            "مثال: اسم زميل، اسم منتج، اسم موقع — افصل بفاصلة",
          )}
          className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={add}
          disabled={busy || input.trim().length < 2}
          className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 rounded px-4 py-2 text-sm"
        >
          {L("Add", "ضيف")}
        </button>
      </div>

      {terms.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {terms.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full ps-3 pe-2 py-1 text-xs"
              dir="auto"
            >
              {t.term}
              {t.source === "learned" && (
                <span className="text-[10px] text-emerald-700">
                  {L("learned", "اتعلمها")}
                </span>
              )}
              <button
                onClick={() => remove(t.id)}
                className="text-slate-400 hover:text-red-600"
                aria-label="remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {corrections.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-medium text-slate-600 mb-1">
            {L("Fixes learned from your corrections", "تصحيحات اتعلمها من تعديلاتك")}
          </p>
          <div className="flex flex-wrap gap-2">
            {corrections.map((c) => (
              <span
                key={c.id}
                className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1"
                dir="auto"
              >
                <span className="text-red-600 line-through">{c.wrong}</span>
                {" → "}
                <span className="text-emerald-700">{c.right}</span>
                {c.count > 1 && <span className="text-slate-400"> ×{c.count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
