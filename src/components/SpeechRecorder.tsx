"use client";

import { useRef, useState } from "react";
import { t as tr, type Lang } from "@/lib/i18n";

interface Drill {
  id: string;
  title: string;
  titleAr: string;
}

const DRILLS: Drill[] = [
  { id: "explain-decision", title: "Explain a decision to your team in 60 seconds — with the why", titleAr: "اشرح قرار لفريقك في ٦٠ ثانية — بالسبب" },
  { id: "assign-task", title: "Assign a task: what — why — what could block you", titleAr: "كلّف حد بمهمة: المطلوب — عشان — إيه اللي ممكن يعطلك" },
  { id: "elevator-pitch", title: "Pitch your company to a stranger in 45 seconds", titleAr: "قدّم شركتك لشخص غريب في ٤٥ ثانية" },
  { id: "hard-question", title: "Answer a hostile question about a delayed delivery", titleAr: "رد على سؤال عدائي عن تسليم متأخر" },
  { id: "praise", title: "Give specific praise to a team member — name the work", titleAr: "امدح واحد من الفريق مدح محدد — سمّي الشغل" },
  { id: "free", title: "Free topic — say the message you actually need to send", titleAr: "موضوع حر — قول الرسالة اللي فعلًا محتاج تبعتها" },
];

interface Metrics {
  durationSec: number;
  wordCount: number;
  wpm: number;
  totalFillers: number;
  fillersPerMinute: number;
  fillerCounts: Record<string, number>;
  longPauses: number;
  longestPauseSec: number;
}

interface Segment {
  start: number;
  end: number;
  text: string;
}

interface Baseline {
  medianVariationSt: number;
  lowVariationSt: number;
  targetVariationSt?: number;
  stretchVariationSt?: number;
}

interface Tone {
  available: boolean;
  pitch?: { median_hz: number; variation_st: number; range_st: number };
  energy_variation?: number;
  speaking_ratio?: number;
  delivery?: "flat" | "moderate" | "varied" | string;
  baseline?: Baseline;
}

export default function SpeechRecorder({ lang }: { lang: Lang }) {
  const [drill, setDrill] = useState<Drill>(DRILLS[0]);
  const [audioLang, setAudioLang] = useState<"ar" | "en" | "auto">("ar");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [originalTranscript, setOriginalTranscript] = useState("");
  const [durationSec, setDurationSec] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [audioPath, setAudioPath] = useState<string | undefined>();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tone, setTone] = useState<Tone | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);

  async function startRecording() {
    setError(null);
    setTranscript(null);
    setMetrics(null);
    setTone(null);
    setFeedback(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((tk) => tk.stop());
        void processRecording();
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setError(
        L(
          "Microphone access was denied — allow it in the browser.",
          "المتصفح منع المايك — اسمح بيه من إعدادات الصفحة.",
        ),
      );
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // Step 1 — transcribe only. Nothing is judged until the user confirms the text.
  async function processRecording() {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (blob.size < 2000) {
      setError(L("Recording too short.", "التسجيل قصير جدًا."));
      return;
    }
    setBusy(L("Transcribing on this PC…", "بيتفرّغ على الجهاز…"));
    try {
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");
      fd.append("language", audioLang);
      const res = await fetch("/api/speech/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transcription failed");
      setTranscript(data.transcript);
      setOriginalTranscript(data.transcript);
      setMetrics(data.metrics);
      setDurationSec(data.durationSec ?? 0);
      setSegments(data.segments ?? []);
      setTone(data.tone ?? null);
      setAudioPath(data.audioPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  // Step 2 — the (possibly corrected) text goes to the mentor.
  async function requestFeedback() {
    if (!transcript || transcript.trim().length < 2) return;
    setBusy(L("The mentor is reviewing…", "الموجّه بيقيّم…"));
    setError(null);
    try {
      const res = await fetch("/api/speech/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: lang === "ar" ? drill.titleAr : drill.title,
          transcript,
          durationSec,
          segments,
          edited: transcript !== originalTranscript,
          originalTranscript,
          tone,
          audioPath,
        }),
      });
      const fb = await res.json();
      if (!res.ok) throw new Error(fb.error ?? "Feedback failed");
      setFeedback(fb.feedback);
      if (fb.metrics) setMetrics(fb.metrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  const chip = (active: boolean, activeCls: string) =>
    `px-3 py-1.5 rounded-full text-xs border ${
      active ? activeCls : "bg-white text-slate-600 border-slate-300 hover:border-emerald-500"
    }`;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-slate-700">{L("Pick an exercise", "اختار تمرين")}</p>
        <div className="flex flex-wrap gap-2">
          {DRILLS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDrill(d)}
              disabled={recording || busy !== null}
              className={chip(drill.id === d.id, "bg-emerald-600 text-white border-emerald-600")}
            >
              {lang === "ar" ? d.titleAr : d.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-slate-500">{L("Spoken language", "لغة الكلام")}:</span>
          {(
            [
              ["ar", "عربي", "Arabic"],
              ["en", "إنجليزي", "English"],
              ["auto", "تلقائي", "Auto"],
            ] as const
          ).map(([code, ar, en]) => (
            <button
              key={code}
              onClick={() => setAudioLang(code)}
              disabled={recording || busy !== null}
              className={chip(audioLang === code, "bg-slate-700 text-white border-slate-700")}
            >
              {lang === "ar" ? ar : en}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 pt-1">
          {!recording ? (
            <button
              onClick={startRecording}
              disabled={busy !== null}
              className="bg-red-600 hover:bg-red-500 text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-40"
            >
              ● {L("Record", "سجّل")}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-6 py-3 text-sm font-medium animate-pulse"
            >
              ■ {L("Stop", "وقّف")} ({elapsed}s)
            </button>
          )}
          {busy && <span className="text-sm text-slate-500">{busy}</span>}
        </div>
        {error && (
          <p className="text-sm text-red-600" dir="auto">
            {error}
          </p>
        )}
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Stat label={L("Duration", "المدة")} value={`${metrics.durationSec}s`} />
          <Stat label={L("Words", "كلمات")} value={metrics.wordCount} />
          <Stat
            label={L("Pace (wpm)", "السرعة (كلمة/د)")}
            value={metrics.wpm}
            warn={metrics.wpm > 170 || metrics.wpm < 100}
          />
          <Stat
            label={L("Fillers", "لازمات")}
            value={`${metrics.totalFillers} (${metrics.fillersPerMinute}/${L("min", "د")})`}
            warn={metrics.fillersPerMinute > 4}
          />
          <Stat label={L("Long pauses", "وقفات طويلة")} value={metrics.longPauses} />
        </div>
      )}

      {tone?.available && tone.pitch && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Stat
            label={L("Delivery", "النبرة")}
            value={
              tone.delivery === "flat"
                ? L("Flat", "رتيبة")
                : tone.delivery === "varied"
                  ? L("Lively", "متنوعة")
                  : L("Moderate", "متوسطة")
            }
            warn={tone.delivery === "flat"}
          />
          <Stat
            label={
              tone.baseline?.targetVariationSt
                ? L(
                    `Voice movement — target ${tone.baseline.targetVariationSt}`,
                    `حركة النبرة — الهدف ${tone.baseline.targetVariationSt}`,
                  )
                : L("Voice movement (semitones)", "حركة النبرة (نص-درجة)")
            }
            value={tone.pitch.variation_st}
            warn={
              tone.baseline?.targetVariationSt
                ? tone.pitch.variation_st < tone.baseline.targetVariationSt
                : tone.pitch.variation_st < 2
            }
          />
          <Stat
            label={L("Speaking time", "وقت الكلام الفعلي")}
            value={`${Math.round((tone.speaking_ratio ?? 0) * 100)}%`}
            warn={(tone.speaking_ratio ?? 1) < 0.5}
          />
        </div>
      )}

      {transcript !== null && !feedback && (
        <div className="bg-white border border-amber-300 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-amber-700">
            {L("Check the text before the mentor reads it", "راجع النص قبل ما الموجّه يقراه")}
          </p>
          <p className="text-xs text-slate-500">
            {L(
              "Automatic transcription is never perfect with spoken dialect. Fix any wrong word — scoring uses this text.",
              "التفريغ الآلي مش مظبوط ١٠٠٪ مع العامية. صلّح أي كلمة غلط — التقييم بيتم على النص ده.",
            )}
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
            dir="auto"
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={requestFeedback}
              disabled={busy !== null || transcript.trim().length < 2}
              className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 rounded px-4 py-2 text-sm font-medium"
            >
              {L("Evaluate my speech", "قيّم كلامي")}
            </button>
            {transcript !== originalTranscript && (
              <button
                onClick={() => setTranscript(originalTranscript)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                {L("Undo my edits", "رجّع النص الأصلي")}
              </button>
            )}
          </div>
        </div>
      )}

      {feedback && (
        <>
          {transcript && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                {L("What you said", "اللي قلته")}
              </p>
              <p className="text-sm whitespace-pre-wrap" dir="auto">
                {transcript}
              </p>
              {metrics && Object.keys(metrics.fillerCounts).length > 0 && (
                <p className="text-xs text-amber-700 mt-2" dir="auto">
                  {L("Filler breakdown:", "تفصيل اللازمات:")}{" "}
                  {Object.entries(metrics.fillerCounts)
                    .map(([w, n]) => `${w}×${n}`)
                    .join(" · ")}
                </p>
              )}
            </div>
          )}
          <div className="bg-white border border-emerald-300 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-emerald-700 mb-2">
              {tr(lang, "coach_label")}
            </p>
            <div className="text-sm whitespace-pre-wrap leading-relaxed" dir="auto">
              {feedback}
            </div>
            <button
              onClick={startRecording}
              className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded px-4 py-2 text-sm"
            >
              {L("New drill", "تمرين جديد")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2 text-center ${
        warn ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"
      }`}
    >
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
