import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { t, DIMENSION_KEYS, DIMENSION_DEFS } from "@/lib/i18n";
import { mdToHtml } from "@/lib/markdown";

export const dynamic = "force-dynamic";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

interface AxisScore {
  score: number | null;
  quote: string;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lang = await getLang();
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) notFound();

  let overall: number | null = null;
  let axes: Record<string, AxisScore> = {};
  try {
    const s = session.scores ? JSON.parse(session.scores) : {};
    if (typeof s.overall === "number") overall = s.overall;
    if (s.axes && typeof s.axes === "object") axes = s.axes;
  } catch {}

  let turns: Turn[] = [];
  let plainTranscript = "";
  try {
    const parsed = JSON.parse(session.transcript);
    if (Array.isArray(parsed?.messages)) turns = parsed.messages;
  } catch {
    // speech drills store the raw spoken text, not JSON
    plainTranscript = session.transcript;
  }

  let metrics: Record<string, unknown> = {};
  try {
    if (session.metrics) metrics = JSON.parse(session.metrics);
  } catch {}

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/sessions" className="text-sm text-slate-500 hover:text-slate-900">
          ← {t(lang, "sess_title")}
        </Link>
        <div className="flex items-baseline justify-between mt-1 gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold">{session.scenario ?? "—"}</h1>
          {overall !== null && (
            <span className="text-lg font-semibold text-emerald-700">{overall}/10</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {t(lang, session.mode === "roleplay" ? "mode_roleplay" : "mode_speech")} ·{" "}
          {session.createdAt.toISOString().slice(0, 10)}
        </p>
      </div>

      {Object.keys(axes).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-medium text-emerald-700 mb-3">{t(lang, "sess_scores")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(axes).map(([k, v]) => (
              <div
                key={k}
                title={DIMENSION_DEFS[k] ? t(lang, DIMENSION_DEFS[k]) : undefined}
                className="border border-slate-200 rounded-lg p-2.5"
              >
                <p className="text-xs text-slate-500">
                  {DIMENSION_KEYS[k] ? t(lang, DIMENSION_KEYS[k]) : k}
                </p>
                <p className="text-lg font-semibold mt-0.5">
                  {typeof v?.score === "number" ? `${v.score}/10` : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {session.debrief && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-medium text-emerald-700 mb-3">{t(lang, "sess_debrief")}</h2>
          <div
            className="prose prose-sm prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: mdToHtml(session.debrief) }}
          />
        </div>
      )}

      {Object.keys(metrics).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-medium text-emerald-700 mb-3">{t(lang, "sess_metrics")}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics)
              .filter(([, v]) => typeof v === "number" || typeof v === "string")
              .map(([k, v]) => (
                <span
                  key={k}
                  className="text-xs bg-slate-100 text-slate-700 rounded-full px-3 py-1"
                >
                  {k}: {String(v)}
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="font-medium text-emerald-700 mb-3">{t(lang, "sess_transcript")}</h2>
        {turns.length > 0 ? (
          <div className="space-y-2">
            {turns.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-slate-200"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{plainTranscript || "—"}</p>
        )}
      </div>
    </div>
  );
}
