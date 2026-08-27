import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import { prisma } from "@/lib/db";
import { getOrCreateLabel } from "@/lib/anonymize";
import {
  parseWhatsAppTxt,
  detectLang,
  isSelf,
  type ParsedMessage,
} from "@/lib/parsers/whatsapp";
import { parseWaSheetCsv, looksLikeWaSheet } from "@/lib/parsers/washeet";
import { selfAliases } from "@/lib/settings";

export const runtime = "nodejs";

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


function contentHash(m: ParsedMessage): string {
  return createHash("sha256")
    .update(`${m.sentAt?.toISOString() ?? "?"}|${m.sender}|${m.content}`)
    .digest("hex");
}

async function storeParsed(
  fileName: string,
  parsed: ReturnType<typeof parseWhatsAppTxt>,
  aliases: string[]
): Promise<FileReport> {
  const report: FileReport = {
    file: fileName,
    format: parsed.format,
    parsed: parsed.messages.length,
    added: 0,
    duplicates: 0,
    selfMessages: 0,
    otherMessages: 0,
    systemLines: parsed.systemLines,
    mediaOmitted: parsed.mediaOmitted,
    dateRange: { from: null, to: null },
    langSplit: {},
    failures: parsed.failures,
  };

  if (parsed.messages.length === 0) return report;

  // Chat counterpart = most frequent non-self sender in this export.
  const otherCounts = new Map<string, number>();
  for (const m of parsed.messages) {
    if (!isSelf(m.sender, aliases)) {
      otherCounts.set(m.sender, (otherCounts.get(m.sender) ?? 0) + 1);
    }
  }
  const dominantOther =
    [...otherCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Pseudonym labels for every non-self sender (mapping stays local, §7.5)
  const labelCache = new Map<string, string>();
  for (const name of otherCounts.keys()) {
    labelCache.set(name, await getOrCreateLabel(name));
  }
  const chatLabel = dominantOther ? labelCache.get(dominantOther)! : null;

  const rows = parsed.messages.map((m) => {
    const self = isSelf(m.sender, aliases);
    const lang = detectLang(m.content);
    return {
      source: "whatsapp",
      externalRef: fileName,
      author: self ? "self" : "other",
      counterpart: self ? chatLabel : (labelCache.get(m.sender) ?? null),
      lang,
      sentAt: m.sentAt,
      content: m.content,
      contentHash: contentHash(m),
    };
  });

  // Dedup within the batch, then against the DB (SQLite has no skipDuplicates)
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    if (seen.has(r.contentHash)) return false;
    seen.add(r.contentHash);
    return true;
  });
  const hashes = unique.map((r) => r.contentHash);
  const existing = new Set<string>();
  for (let i = 0; i < hashes.length; i += 500) {
    const found = await prisma.message.findMany({
      where: { contentHash: { in: hashes.slice(i, i + 500) } },
      select: { contentHash: true },
    });
    found.forEach((f) => existing.add(f.contentHash));
  }
  const fresh = unique.filter((r) => !existing.has(r.contentHash));
  if (fresh.length > 0) {
    await prisma.message.createMany({ data: fresh });
  }

  report.added = fresh.length;
  report.duplicates = rows.length - fresh.length;
  for (const r of rows) {
    if (r.author === "self") report.selfMessages++;
    else report.otherMessages++;
    report.langSplit[r.lang] = (report.langSplit[r.lang] ?? 0) + 1;
  }
  const dates = parsed.messages
    .map((m) => m.sentAt)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length > 0) {
    report.dateRange.from = dates[0].toISOString().slice(0, 10);
    report.dateRange.to = dates[dates.length - 1].toISOString().slice(0, 10);
  }
  return report;
}

// Rows from the WhatsApp Business pipeline sheet (CSV export). "out" rows are
// the user's own writing; counterpart is per-row.
async function storeSheetCsv(fileName: string, csv: string): Promise<FileReport> {
  const parsed = parseWaSheetCsv(csv);
  const report: FileReport = {
    file: fileName,
    format: "wa-business-sheet",
    parsed: parsed.messages.length,
    added: 0,
    duplicates: 0,
    selfMessages: 0,
    otherMessages: 0,
    systemLines: parsed.reactionsSkipped,
    mediaOmitted: parsed.mediaSkipped,
    dateRange: { from: null, to: null },
    langSplit: {},
    failures: [],
    notes:
      parsed.broadcastSkipped > 0
        ? [`${parsed.broadcastSkipped} broadcast/template messages excluded from your style corpus`]
        : [],
  };
  if (!parsed.isSheet) {
    report.failures = ["File does not look like the WhatsApp pipeline sheet (needs wa_id + direction columns)"];
    return report;
  }
  if (parsed.messages.length === 0) return report;

  const labelCache = new Map<string, string>();
  for (const m of parsed.messages) {
    if (!labelCache.has(m.counterpartName)) {
      labelCache.set(m.counterpartName, await getOrCreateLabel(m.counterpartName));
    }
  }

  const rows = parsed.messages.map((m) => ({
    source: "whatsapp",
    externalRef: fileName,
    author: m.author,
    counterpart: labelCache.get(m.counterpartName) ?? null,
    lang: detectLang(m.content),
    sentAt: m.sentAt,
    content: m.content,
    contentHash: createHash("sha256")
      .update(`${m.sentAt?.toISOString() ?? "?"}|${m.author}:${m.counterpartName}|${m.content}`)
      .digest("hex"),
  }));

  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    if (seen.has(r.contentHash)) return false;
    seen.add(r.contentHash);
    return true;
  });
  const existing = new Set<string>();
  const hashes = unique.map((r) => r.contentHash);
  for (let i = 0; i < hashes.length; i += 500) {
    const found = await prisma.message.findMany({
      where: { contentHash: { in: hashes.slice(i, i + 500) } },
      select: { contentHash: true },
    });
    found.forEach((f) => existing.add(f.contentHash));
  }
  const fresh = unique.filter((r) => !existing.has(r.contentHash));
  if (fresh.length > 0) await prisma.message.createMany({ data: fresh });

  report.added = fresh.length;
  report.duplicates = rows.length - fresh.length;
  for (const r of rows) {
    if (r.author === "self") report.selfMessages++;
    else report.otherMessages++;
    report.langSplit[r.lang] = (report.langSplit[r.lang] ?? 0) + 1;
  }
  const dates = rows
    .map((r) => r.sentAt)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length > 0) {
    report.dateRange.from = dates[0].toISOString().slice(0, 10);
    report.dateRange.to = dates[dates.length - 1].toISOString().slice(0, 10);
  }
  return report;
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const aliases = selfAliases();
  if (aliases.length === 0) {
    return NextResponse.json(
      { error: "SELF_ALIASES is empty — set it in .env.local so the parser knows which messages are yours." },
      { status: 400 }
    );
  }

  // Raw files stay on local disk (§10.1)
  const rawDir = path.join(process.cwd(), "data", "raw");
  await mkdir(rawDir, { recursive: true });

  const reports: FileReport[] = [];
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^\w.\- ()؀-ۿ]/g, "_");
    await writeFile(path.join(rawDir, `${Date.now()}-${safeName}`), buf);

    if (file.name.toLowerCase().endsWith(".zip")) {
      const zip = new AdmZip(buf);
      const txtEntries = zip
        .getEntries()
        .filter((e) => !e.isDirectory && e.entryName.toLowerCase().endsWith(".txt"));
      if (txtEntries.length === 0) {
        reports.push({
          file: file.name, format: "unknown", parsed: 0, added: 0, duplicates: 0,
          selfMessages: 0, otherMessages: 0, systemLines: 0, mediaOmitted: 0,
          dateRange: { from: null, to: null }, langSplit: {},
          failures: ["zip contains no .txt chat export"],
        });
        continue;
      }
      for (const entry of txtEntries) {
        const text = entry.getData().toString("utf-8");
        reports.push(
          await storeParsed(`${file.name}:${entry.entryName}`, parseWhatsAppTxt(text), aliases)
        );
      }
    } else {
      const text = buf.toString("utf-8");
      if (file.name.toLowerCase().endsWith(".csv") || looksLikeWaSheet(text)) {
        reports.push(await storeSheetCsv(file.name, text));
      } else {
        reports.push(await storeParsed(file.name, parseWhatsAppTxt(text), aliases));
      }
    }
  }

  const totals = await prisma.message.groupBy({ by: ["source"], _count: { _all: true } });
  return NextResponse.json({
    reports,
    totals: Object.fromEntries(totals.map((t) => [t.source, t._count._all])),
  });
}
