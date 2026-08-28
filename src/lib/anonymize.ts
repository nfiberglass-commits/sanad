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
const URL = /(?:https?:\/\/|www\.)[^\s<>"«»]+/gi;

// Symbols that show up in real passwords but not in product or order codes.
// Hyphen, underscore, dot and slash are code punctuation and do NOT count —
// "STP-IR-Y18" and "SO3437" must survive untouched.
const HARD_SYMBOL = /[!@#$%^&*+=?~]/;

// A standalone token shaped like a credential: 8+ chars, letters AND digits,
// plus mixed case or a hard symbol.
function looksLikeSecret(token: string): boolean {
  const w = token.replace(/^["'«(\[]+|["'»)\].,;:!?؟،]+$/g, "");
  if (w.length < 8) return false;
  if (!/[A-Za-z]/.test(w) || !/\d/.test(w)) return false;
  return (/[a-z]/.test(w) && /[A-Z]/.test(w)) || HARD_SYMBOL.test(w);
}

// Words that announce a credential, Arabic or English.
const PWD_WORD = /(password|passw|pwd|باسورد|السر|المرور|السري)/i;
const PWD_WORD_EXACT = /^(pass|pw)[:=]?$/i;

// After a password word, the first nearby token holding latin letters or
// digits is treated as the credential itself — catches lowercase-only
// passwords ("nile2026") that the shape heuristic cannot flag safely.
function maskPasswordMentions(s: string): string {
  const parts = s.split(/(\s+)/);
  for (let i = 0; i < parts.length; i += 2) {
    const tok = parts[i] ?? "";
    if (!PWD_WORD.test(tok) && !PWD_WORD_EXACT.test(tok)) continue;
    let seen = 0;
    for (let j = i + 2; j < parts.length && seen < 4; j += 2, seen++) {
      const cand = parts[j] ?? "";
      if (/[A-Za-z0-9]/.test(cand) && cand.length >= 4) {
        parts[j] = "[secret]";
        break;
      }
    }
  }
  return parts.join("");
}

export function maskContent(s: string): string {
  let out = s.replace(URL, "[link]").replace(EMAIL, "[email]").replace(PHONE, "[phone]");
  out = maskPasswordMentions(out);
  out = out.replace(/\S+/g, (tok) => (looksLikeSecret(tok) ? "[secret]" : tok));
  return out;
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
