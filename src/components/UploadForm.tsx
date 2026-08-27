"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t as tr, type Lang } from "@/lib/i18n";

interface FileReport {
  file: string;
  format: string;
  parsed: number;
  added: number;
  duplicates: number;
  selfMessages: number;
  otherMessages: number;
  systemLines: number;
  mediaOmitted: number;
  dateRange: { from: string | null; to: string | null };
  langSplit: Record<string, number>;
  failures: string[];
  notes?: string[];
}

export default function UploadForm({ lang }: { lang: Lang }) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<FileReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    setReports(null);
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("files", f);
    const res = await fetch("/api/ingest/upload", { method: "POST", body: fd });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    setReports(data.reports);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={upload}
        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
      >
        <p className="text-sm text-slate-700">{tr(lang, "upload_help")}</p>
        <input
          type="file"
          multiple
          accept=".txt,.zip,.csv"
          onChange={(e) => setFiles(e.target.files)}
          className="text-sm file:bg-slate-200 file:border-0 file:rounded file:px-3 file:py-1.5 file:text-slate-800 file:mr-3"
        />
        <button
          type="submit"
          disabled={busy || !files || files.length === 0}
          className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 rounded px-4 py-2 text-sm font-medium block"
        >
          {busy ? tr(lang, "parsing") : tr(lang, "upload_parse")}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {reports && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h2 className="font-medium text-emerald-700">{tr(lang, "ingest_report")}</h2>
          {reports.map((r, i) => (
            <div key={i} className="text-sm border-b border-slate-200 pb-2 last:border-0">
              <p className="font-medium" dir="auto">{r.file}</p>
              <p className="text-slate-600 text-xs mt-1">
                format: {r.format} · parsed: {r.parsed} · added: <b className="text-emerald-700">{r.added}</b> ·
                duplicates: {r.duplicates} · yours: {r.selfMessages} · others: {r.otherMessages} ·
                system: {r.systemLines} · media skipped: {r.mediaOmitted}
              </p>
              <p className="text-slate-500 text-xs">
                {r.dateRange.from ? `${r.dateRange.from} → ${r.dateRange.to}` : "no dates"} ·
                languages: {Object.entries(r.langSplit).map(([k, v]) => `${k}:${v}`).join(" ") || "—"}
              </p>
              {(r.notes ?? []).map((n, j) => (
                <p key={j} className="text-sky-700 text-xs mt-1">ℹ {n}</p>
              ))}
              {r.selfMessages === 0 && r.parsed > 0 && (
                <p className="text-amber-700 text-xs mt-1">
                  ⚠ None of these messages matched your SELF_ALIASES — check the sender
                  name in the export and add it to .env.local.
                </p>
              )}
              {r.failures.length > 0 && (
                <details className="mt-1">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    {r.failures.length} unparsed line sample(s)
                  </summary>
                  <ul className="text-xs text-slate-500 mt-1 space-y-0.5">
                    {r.failures.map((f, j) => (
                      <li key={j} dir="auto" className="truncate">{f}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
