import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function overallOf(scores: string | null): number | null {
  if (!scores) return null;
  try {
    const v = JSON.parse(scores).overall;
    return typeof v === "number" ? v : null;
  } catch {
    return null;
  }
}

export default async function SessionsPage() {
  const lang = await getLang();
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, mode: true, scenario: true, scores: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{t(lang, "sess_title")}</h1>
        <span className="text-sm text-slate-500">{sessions.length}</span>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-slate-500">
          {t(lang, "no_sessions_yet")}{" "}
          <Link href="/roleplay" className="text-emerald-700">
            {t(lang, "a_roleplay")}
          </Link>
          .
        </p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs bg-slate-50">
                <th className="py-2 px-4 text-start">{t(lang, "col_date")}</th>
                <th className="py-2 px-4 text-start">{t(lang, "col_mode")}</th>
                <th className="py-2 px-4 text-start">{t(lang, "col_scenario")}</th>
                <th className="py-2 px-4 text-end">{t(lang, "col_score")}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const overall = overallOf(s.scores);
                return (
                  <tr key={s.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="py-2 px-4 text-slate-600 whitespace-nowrap">
                      {s.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="py-2 px-4 text-slate-600 whitespace-nowrap">
                      {t(lang, s.mode === "roleplay" ? "mode_roleplay" : "mode_speech")}
                    </td>
                    <td className="py-2 px-4">
                      <Link href={`/sessions/${s.id}`} className="text-emerald-700 hover:underline">
                        {s.scenario ?? "—"}
                      </Link>
                    </td>
                    <td className="py-2 px-4 text-end text-emerald-700 whitespace-nowrap">
                      {overall !== null ? `${overall}/10` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
