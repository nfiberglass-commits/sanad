import { prisma } from "@/lib/db";
import { latestProfile, type ProfileDimension } from "@/lib/profile";
import RadarProfile from "@/components/RadarProfile";
import GenerateProfileButton from "@/components/GenerateProfileButton";
import { getLang } from "@/lib/lang-server";
import { t, DIMENSION_KEYS, DIMENSION_DEFS } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function isScored(d: unknown): d is ProfileDimension {
  return !!d && typeof d === "object" && "score" in d;
}

// Only a dimension with a real number belongs on the radar. score: null means
// "not enough data to judge" — plotting it as 0 states a result we never had.
function hasNumericScore(d: unknown): d is ProfileDimension & { score: number } {
  return isScored(d) && typeof d.score === "number";
}

export default async function ProfilePage() {
  const lang = await getLang();
  const profile = await latestProfile();
  const selfCount = await prisma.message.count({ where: { author: "self" } });
  const versions = await prisma.styleProfile.findMany({
    orderBy: { version: "desc" },
    select: { version: true, createdAt: true, sampleSize: true },
    take: 10,
  });

  const radar =
    profile &&
    Object.entries(profile.json.dimensions ?? {})
      .filter(([k, v]) => DIMENSION_KEYS[k] && hasNumericScore(v))
      .map(([k, v]) => ({
        dimension: t(lang, DIMENSION_KEYS[k]),
        score: (v as ProfileDimension).score as number,
      }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{t(lang, "profile_title")}</h1>
          {profile ? (
            <p className="text-sm text-slate-600 mt-1">
              {t(lang, "version")} {profile.version} · {profile.sampleSize}{" "}
              {t(lang, "profile_meta")} · {profile.createdAt.toISOString().slice(0, 10)}
            </p>
          ) : (
            <p className="text-sm text-slate-600 mt-1">{t(lang, "no_profile_generated")}</p>
          )}
        </div>
        <GenerateProfileButton hasData={selfCount >= 20} lang={lang} />
      </div>

      {profile && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              {radar && radar.length > 0 ? (
                <RadarProfile data={radar} />
              ) : (
                <p className="text-slate-500 text-sm">{t(lang, "no_scored")}</p>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h2 className="font-medium text-emerald-700">{t(lang, "focus_areas")}</h2>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {(profile.json.top_3_focus_areas ?? []).map((f, i) => (
                  <li key={i} dir="auto">{f}</li>
                ))}
              </ol>
              <h2 className="font-medium text-emerald-700 pt-2">{t(lang, "habits")}</h2>
              <div className="text-sm space-y-1 text-slate-700">
                <p><span className="text-slate-500">{t(lang, "strengths")}</span> <span dir="auto">{(profile.json.habits?.strengths ?? []).join(" · ")}</span></p>
                <p><span className="text-slate-500">{t(lang, "weaknesses")}</span> <span dir="auto">{(profile.json.habits?.weaknesses ?? []).join(" · ")}</span></p>
                <p><span className="text-slate-500">{t(lang, "verbal_tics")}</span> <span dir="auto">{(profile.json.habits?.verbal_tics ?? []).join(" · ")}</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <h2 className="font-medium text-emerald-700">{t(lang, "dimensions_evidence")}</h2>
            {Object.entries(profile.json.dimensions ?? {}).map(([key, dim]) => (
              <div key={key} className="border-b border-slate-200 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {DIMENSION_KEYS[key] ? t(lang, DIMENSION_KEYS[key]) : key}
                  </span>
                  {isScored(dim) && (
                    <span className="text-sm px-2 py-0.5 rounded bg-slate-200 text-emerald-700">
                      {dim.score === null ? "n/a" : `${dim.score}/10`}
                    </span>
                  )}
                </div>
                {DIMENSION_DEFS[key] && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t(lang, DIMENSION_DEFS[key])}
                  </p>
                )}
                <p className="text-sm text-slate-600 mt-1" dir="auto">
                  {(dim as { notes?: string }).notes}
                </p>
                {isScored(dim) && dim.evidence?.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {dim.evidence.map((q, i) => (
                      <li key={i} dir="auto" className="text-xs text-slate-500 italic">
                        &ldquo;{q}&rdquo;
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <h2 className="font-medium text-emerald-700">{t(lang, "context_patterns")}</h2>
            <p className="text-sm" dir="auto"><span className="text-slate-500">{t(lang, "with_team")}</span> {profile.json.context_patterns?.with_team}</p>
            <p className="text-sm" dir="auto"><span className="text-slate-500">{t(lang, "with_clients")}</span> {profile.json.context_patterns?.with_clients}</p>
            <p className="text-sm" dir="auto"><span className="text-slate-500">{t(lang, "under_pressure")}</span> {profile.json.context_patterns?.under_pressure}</p>
          </div>

          {versions.length > 1 && (
            <div className="text-xs text-slate-500">
              {t(lang, "history")}{" "}
              {versions
                .map((v) => `v${v.version} (${v.createdAt.toISOString().slice(0, 10)}, n=${v.sampleSize})`)
                .join(" · ")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
