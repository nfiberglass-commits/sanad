"use client";

import { useEffect, useRef, useState } from "react";
import { t as tr, DIMENSION_KEYS, type Lang } from "@/lib/i18n";

interface ScenarioLite {
  id: string;
  title: string;
  titleAr: string;
  situation: string;
  situationAr: string;
  defaultDifficulty: number;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

interface AxisScore {
  score: number | null;
  quote: string;
}

interface Debrief {
  overall: number | null;
  done_well: { text: string; quote: string };
  scores: Record<string, AxisScore>;
  rewrites: { original: string; improved: string }[];
  next_drill: string;
  debrief_markdown: string;
}

export default function RoleplayChat({ scenarios, lang }: { scenarios: ScenarioLite[]; lang: Lang }) {
  const [scenario, setScenario] = useState<ScenarioLite | null>(null);
  const [relationship, setRelationship] = useState<string>("peer");
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [coachNote, setCoachNote] = useState<string | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [debriefBusy, setDebriefBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, coachNote, debrief]);

  async function callRoleplay(history: Turn[], coach = false): Promise<string> {
    const res = await fetch("/api/coach/roleplay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: scenario!.id,
        difficulty,
        relationship,
        customSituation: scenario!.id === "custom" ? scenario!.situation : undefined,
        coach,
        messages: history,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Request failed (${res.status})`);
    }
    if (!res.body) throw new Error("No response stream");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      if (!coach) {
        const text = full;
        setTurns((t) => {
          const copy = [...t];
          if (copy.length > 0 && copy[copy.length - 1].role === "assistant") {
            copy[copy.length - 1] = { role: "assistant", content: text };
          } else {
            copy.push({ role: "assistant", content: text });
          }
          return copy;
        });
      }
    }
    return full;
  }

  async function start(s: ScenarioLite) {
    setScenario(s);
    setDifficulty(s.defaultDifficulty);
    setTurns([]);
    setDebrief(null);
    setCoachNote(null);
    setError(null);
  }

  // Counterpart opens the scene
  useEffect(() => {
    if (!scenario || turns.length > 0 || streaming) return;
    setStreaming(true);
    callRoleplay([])
      .catch((e) => setError(e.message))
      .finally(() => setStreaming(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  async function send() {
    const text = input.trim();
    if (!text || streaming || !scenario) return;
    setInput("");
    setError(null);
    setCoachNote(null);
    const history: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(history);
    setStreaming(true);
    try {
      await callRoleplay(history);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setStreaming(false);
    }
  }

  async function pauseCoach() {
    if (!scenario || turns.length === 0 || coachBusy) return;
    setCoachBusy(true);
    setError(null);
    try {
      const note = await callRoleplay(turns, true);
      setCoachNote(note);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coach failed");
    } finally {
      setCoachBusy(false);
    }
  }

  async function endSession() {
    if (!scenario || turns.length < 2 || debriefBusy) return;
    setDebriefBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.id, difficulty, relationship, customSituation: scenario.id === "custom" ? scenario.situation : undefined, messages: turns }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Debrief failed");
      setDebrief(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Debrief failed");
    } finally {
      setDebriefBusy(false);
    }
  }

  function startCustom() {
    const text = customText.trim();
    if (text.length < 10) return;
    start({
      id: "custom",
      title: `Custom: ${text.slice(0, 60)}`,
      titleAr: `موقف خاص: ${text.slice(0, 60)}`,
      situation: text,
      situationAr: text,
      defaultDifficulty: difficulty,
    });
  }

  if (!scenario) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-slate-700">{tr(lang, "relationship")}:</span>
          {(["peer", "manager_down", "member_up"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRelationship(r)}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                relationship === r
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-600 border-slate-300 hover:border-emerald-500"
              }`}
            >
              {tr(lang, r === "peer" ? "rel_peer" : r === "manager_down" ? "rel_manager_down" : "rel_member_up")}
            </button>
          ))}
        </div>

        <div className="bg-white border-2 border-dashed border-emerald-300 rounded-xl p-4">
          {!showCustom ? (
            <button onClick={() => setShowCustom(true)} className="text-start w-full">
              <p className="font-medium text-emerald-700">✎ {tr(lang, "custom_title")}</p>
              <p className="text-xs text-slate-500 mt-1">{tr(lang, "custom_desc")}</p>
            </button>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-emerald-700">{tr(lang, "custom_title")}</p>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                dir="auto"
                placeholder={tr(lang, "custom_placeholder")}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={startCustom}
                disabled={customText.trim().length < 10}
                className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 rounded px-4 py-2 text-sm"
              >
                {tr(lang, "start_session")}
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => start(s)}
            className="text-left bg-white border border-slate-200 hover:border-emerald-600 rounded-xl p-4 transition-colors"
          >
            {lang === "ar" ? (
              <>
                <p className="font-medium" dir="rtl">{s.titleAr}</p>
                <p className="text-xs text-slate-500 mt-2" dir="rtl">{s.situationAr}</p>
              </>
            ) : (
              <>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-slate-500 mt-2" dir="ltr">{s.situation}</p>
              </>
            )}
            <p className="text-xs text-emerald-700 mt-2">
              {tr(lang, "difficulty")} {s.defaultDifficulty}/5
            </p>
          </button>
        ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setScenario(null)}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          {tr(lang, "back_scenarios")}
        </button>
        <span className="font-medium" dir="auto">
          {lang === "ar" ? scenario.titleAr : scenario.title}
        </span>
        <label className="text-xs text-slate-500 ms-auto">
          {tr(lang, "difficulty")}{" "}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            disabled={turns.length > 0}
            className="bg-white border border-slate-300 rounded px-2 py-1 ms-1"
          >
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[300px] max-h-[50vh] overflow-y-auto space-y-3">
        {turns.map((t, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              t.role === "user"
                ? "ms-auto bg-emerald-100 border border-emerald-300"
                : "bg-white border border-slate-300"
            }`}
            dir="auto"
          >
            {t.content}
          </div>
        ))}
        {streaming && turns[turns.length - 1]?.role !== "assistant" && (
          <p className="text-xs text-slate-500">…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {coachNote && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm whitespace-pre-wrap" dir="auto">
          <p className="text-amber-700 font-medium mb-1 text-xs uppercase tracking-wide">{tr(lang, "coach_label")}</p>
          {coachNote}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!debrief && (
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            dir="auto"
            rows={2}
            placeholder={tr(lang, "reply_placeholder")}
            className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={send}
              disabled={streaming || input.trim() === ""}
              className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 rounded px-4 py-1.5 text-sm"
            >
              {tr(lang, "send")}
            </button>
            <button
              onClick={pauseCoach}
              disabled={coachBusy || streaming || turns.length === 0}
              className="bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 rounded px-4 py-1.5 text-xs"
            >
              {coachBusy ? "…" : tr(lang, "pause_coach")}
            </button>
            <button
              onClick={endSession}
              disabled={debriefBusy || streaming || turns.length < 2}
              className="bg-slate-600 hover:bg-slate-500 text-white disabled:opacity-40 rounded px-4 py-1.5 text-xs"
            >
              {debriefBusy ? tr(lang, "scoring") : tr(lang, "end_debrief")}
            </button>
          </div>
        </div>
      )}

      {debrief && (
        <div className="bg-white border border-emerald-300 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-emerald-700">{tr(lang, "debrief")}</h2>
            {debrief.overall !== null && (
              <span className="text-lg font-semibold">{debrief.overall}/10</span>
            )}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(debrief.scores).map(([k, v]) => (
              <div key={k} className="bg-slate-200 rounded p-2 text-center">
                <p className="text-[10px] text-slate-500">{DIMENSION_KEYS[k] ? tr(lang, DIMENSION_KEYS[k]) : k}</p>
                <p className="text-sm font-medium">
                  {v.score === null ? "—" : `${v.score}/10`}
                </p>
              </div>
            ))}
          </div>
          <div className="text-sm space-y-1">
            <p className="text-emerald-700 font-medium">{tr(lang, "done_well")}</p>
            <p dir="auto">{debrief.done_well.text}</p>
            <p dir="auto" className="text-xs text-slate-500 italic">&ldquo;{debrief.done_well.quote}&rdquo;</p>
          </div>
          {debrief.rewrites.map((r, i) => (
            <div key={i} className="text-sm space-y-1 border-t border-slate-200 pt-3">
              <p className="text-red-600 text-xs">{tr(lang, "original")}</p>
              <p dir="auto" className="text-slate-600">{r.original}</p>
              <p className="text-emerald-700 text-xs">{tr(lang, "stronger")}</p>
              <p dir="auto">{r.improved}</p>
            </div>
          ))}
          <div className="text-sm border-t border-slate-200 pt-3">
            <p className="text-amber-700 text-xs uppercase tracking-wide mb-1">{tr(lang, "next_drill")}</p>
            <p dir="auto">{debrief.next_drill}</p>
          </div>
          <div className="text-sm border-t border-slate-200 pt-3 whitespace-pre-wrap" dir="auto">
            {debrief.debrief_markdown}
          </div>
          <button
            onClick={() => setScenario(null)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-4 py-2 text-sm"
          >
            {tr(lang, "new_session_btn")}
          </button>
        </div>
      )}
    </div>
  );
}
