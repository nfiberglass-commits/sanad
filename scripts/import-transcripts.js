// Import voice-note transcripts into CommCoach as source="transcript" messages.
// Usage: node import-transcripts.js <transcripts.json> <out-audio.json>
//   transcripts.json : { "<driveFileId>": { text, language, duration } }
//   out-audio.json   : [ { fileId, date, wa, name } ]  (from the pipeline sheet)
// All rows are author="self" — the list was pre-filtered to direction=out.
const { PrismaClient } = require("@prisma/client");
const { createHash } = require("crypto");
const fs = require("fs");

const prisma = new PrismaClient();

function detectLang(s) {
  const ar = (s.match(/[؀-ۿݐ-ݿ]/g) ?? []).length;
  const la = (s.match(/[a-zA-Z]/g) ?? []).length;
  const total = ar + la;
  if (total === 0) return "en";
  const r = ar / total;
  return r >= 0.85 ? "ar" : r <= 0.15 ? "en" : "mixed";
}

function indexToLabel(i) {
  let label = "";
  let n = i;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `Contact ${label}`;
}

async function getOrCreateLabel(realName) {
  const name = (realName || "").trim() || "unknown";
  const existing = await prisma.pseudonym.findUnique({ where: { realName: name } });
  if (existing) return existing.label;
  const count = await prisma.pseudonym.count();
  for (let i = count; i < count + 100; i++) {
    try {
      const row = await prisma.pseudonym.create({ data: { realName: name, label: indexToLabel(i) } });
      return row.label;
    } catch {}
  }
  return "Contact ?";
}

async function main() {
  const [transcriptsPath, metaPath] = process.argv.slice(2);
  const transcripts = JSON.parse(fs.readFileSync(transcriptsPath, "utf8"));
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const metaById = new Map(meta.map((m) => [m.fileId, m]));

  let added = 0, dupes = 0, skipped = 0, updated = 0;
  for (const [fileId, t] of Object.entries(transcripts)) {
    if (!t.text || t.text.trim().length < 3) { skipped++; continue; }
    const m = metaById.get(fileId);
    const counterpartName = m ? (m.name || m.wa) : "unknown";
    const label = await getOrCreateLabel(counterpartName);
    const sentAt = m && m.date ? new Date(m.date) : null;
    const contentHash = createHash("sha256")
      .update(`voice|${fileId}`)
      .digest("hex");
    const text = t.text.trim();
    const existing = await prisma.message.findUnique({ where: { contentHash } });
    if (existing) {
      // Re-transcribed with a better model — replace the old text in place.
      if (existing.content !== text) {
        await prisma.message.update({
          where: { contentHash },
          data: { content: text, lang: detectLang(text) },
        });
        updated++;
      } else {
        dupes++;
      }
      continue;
    }
    await prisma.message.create({
      data: {
        source: "transcript",
        externalRef: `voice:${fileId}`,
        author: "self",
        counterpart: label,
        lang: detectLang(text),
        sentAt,
        content: text,
        contentHash,
      },
    });
    added++;
  }
  console.log(JSON.stringify({ added, updated, dupes, skipped }));
  await prisma.$disconnect();
}

main();
