import Link from "next/link";
import { prisma } from "@/lib/db";
import { latestProfile, type ProfileDimension } from "@/lib/profile";
import RadarProfile from "@/components/RadarProfile";
import { getLang } from "@/lib/lang-server";
import { t, DIMENSION_KEYS } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const lang = await getLang();
  const [selfCount, otherCount, profile, sessions, sessionCount] = await Promise.all([
    prisma.message.count({ where: { author: "self" } }),
    prisma.message.count({ where: { author: "other" } }),
    latestProfile(),
    prisma.session.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.session.count(),
  ]);

  const radar =
    profile &&
    Object.entries(profile.json.dimensions ?? {})
      .filter(
        ([k, v]) =>
          DIMENSION_KEYS[k] &&
          v &&
          typeof v === "object" &&
          typeof (v as ProfileDimension).score === "number"
      )
      .map(([k, v]) => ({
        dimension: t(lang, DIMENSION_KEYS[k]),
        score: (v as ProfileDimension).score as number,
      }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t(lang, "dash_title")}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label={t(lang, "stat_your_messages")} value={selfCount} />
        <Stat label={t(lang, "stat_context")} value={otherCount} />
        <Stat label={t(lang, "stat_profile_version")} value={profile ? `v${profile.version}` : "—"} />
        <Stat label={t(lang, "stat_sessions")} value={sessionCount} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-emerald-700">{t(lang, "style_profile")}</h2>
            <Link href="/profile" className="text-xs text-slate-600 hover:text-slate-900">
              {t(lang, "details")}
            </Link>
          </div>
          {radar && radar.length > 0 ? (
            <RadarProfile data={radar} />
          ) : (
            <p className="text-sm text-slate-500 mt-4">
              {t(lang, "no_profile_yet")}{" "}
              <Link href="/data-sources" className="text-emerald-700">
                {t(lang, "upload_chats")}
              </Link>
              {t(lang, "then_generate")}
            </p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-emerald-700">{t(lang, "recent_sessions")}</h2>
            <span className="flex gap-3">
              <Link href="/sessions" className="text-xs text-slate-600 hover:text-slate-900">
                {t(lang, "all_sessions")}
              </Link>
              <Link href="/roleplay" className="text-xs text-slate-600 hover:text-slate-900">
                {t(lang, "new_session")}
              </Link>
            </span>
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500 mt-4">
              {t(lang, "no_sessions_yet")}{" "}
              <Link href="/roleplay" className="text-emerald-700">
                {t(lang, "a_roleplay")}
              </Link>
              .
            </p>
          ) : (
            <table className="w-full text-sm mt-3">
              <thead>
                <tr className="text-start text-slate-500 text-xs">
                  <th className="py-1 text-start">{t(lang, "col_date")}</th>
                  <th className="py-1 text-start">{t(lang, "col_scenario")}</th>
                  <th className="py-1 text-end">{t(lang, "col_score")}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  let overall: number | null = null;
                  try {
                    overall = s.scores ? (JSON.parse(s.scores).overall ?? null) : null;
                  } catch {}
                  return (
                    <tr key={s.id} className="border-t border-slate-200">
                      <td className="py-1.5 text-slate-600">
                        {s.createdAt.toISOString().slice(0, 10)}
                      </td>
                      <td className="py-1.5">
                        <Link href={`/sessions/${s.id}`} className="hover:text-emerald-700">
                          {s.scenario}
                        </Link>
                      </td>
                      <td className="py-1.5 text-end text-emerald-700">
                        {overall !== null ? `${overall}/10` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
