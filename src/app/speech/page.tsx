import SpeechRecorder from "@/components/SpeechRecorder";
import { getLang } from "@/lib/lang-server";

export const dynamic = "force-dynamic";

export default async function SpeechPage() {
  const lang = await getLang();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {lang === "ar" ? "تمرين الصوت" : "Speech Drill"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {lang === "ar"
            ? "اختار تمرين، سجّل بصوتك، والموجّه يقيس سرعتك ولازماتك ووقفاتك ويقولك رأيه — كل التفريغ بيحصل على جهازك."
            : "Pick an exercise, record yourself, and the mentor measures your pace, fillers, and pauses, then gives an opinion — all transcription happens on this PC."}
        </p>
      </div>
      <SpeechRecorder lang={lang} />
    </div>
  );
}
