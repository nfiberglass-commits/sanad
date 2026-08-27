import { prisma } from "./db";

// §7.5 — before any content is sent to the LLM, counterpart real names become
// stable pseudonyms and phone numbers / emails are masked. The mapping lives
// only in the local SQLite DB.

function indexToLabel(i: number): string {
  // 0 → A, 25 → Z, 26 → AA ...
  let label = "";
  let n = i;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `Contact ${label}`;
}

export async function getOrCreateLabel(realName: string): Promise<string> {
  const name = realName.trim();
  if (!name) return "Contact ?";
  const existing = await prisma.pseudonym.findUnique({ where: { realName: name } });
  if (existing) return existing.label;
  const count = await prisma.pseudonym.count();
  // Retry on label collision (deleted rows can leave gaps)
  for (let i = count; i < count + 100; i++) {
    const label = indexToLabel(i);
    try {
      const row = await prisma.pseudonym.create({ data: { realName: name, label } });
      return row.label;
    } catch {
      // label taken — try next
    }
  }
  return "Contact ?";
}

const PHONE = /(?:\+?\d[\d\s\-()]{7,}\d)/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;

export function maskContent(s: string): string {
  return s.replace(EMAIL, "[email]").replace(PHONE, "[phone]");
}

// Replace every known real counterpart name appearing inside message text
// with its pseudonym, then mask phones/emails.
export async function anonymizeTexts(texts: string[]): Promise<string[]> {
  const map = await prisma.pseudonym.findMany();
  // Longest names first so "Ahmed Ali" is replaced before "Ahmed"
  map.sort((a, b) => b.realName.length - a.realName.length);
  return texts.map((t) => {
    let out = t;
    for (const { realName, label } of map) {
      if (realName.length < 3) continue;
      out = out.split(realName).join(label);
    }
    return maskContent(out);
  });
}
