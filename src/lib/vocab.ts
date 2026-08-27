import { prisma } from "./db";

// Personal vocabulary: the app learns the words THIS user actually says —
// team names, products, sites, jargon — so the speech model stops guessing
// them wrong. Two mechanisms:
//   1. Terms are fed into the transcription prompt (the model expects them).
//   2. Repeated corrections are applied automatically afterwards.

const MAX_PRIMER_TERMS = 60;
const AUTO_APPLY_AFTER = 2; // a correction repeats twice before it's trusted

export async function getPrimerTerms(): Promise<string[]> {
  const rows = await prisma.vocabTerm.findMany({
    orderBy: [{ hits: "desc" }, { createdAt: "desc" }],
    take: MAX_PRIMER_TERMS,
  });
  return rows.map((r) => r.term);
}

export async function addTerm(term: string, kind: string, source = "manual") {
  const clean = term.trim();
  if (clean.length < 2 || clean.length > 60) return null;
  return prisma.vocabTerm.upsert({
    where: { term: clean },
    update: { hits: { increment: 1 } },
    create: { term: clean, kind, source },
  });
}

export async function removeTerm(id: string) {
  await prisma.vocabTerm.delete({ where: { id } }).catch(() => {});
}

// Apply corrections the user has confirmed more than once.
export async function applyCorrections(text: string): Promise<string> {
  const rows = await prisma.correction.findMany({
    where: { count: { gte: AUTO_APPLY_AFTER } },
  });
  let out = text;
  // Longest first so multi-word fixes win over single words.
  rows.sort((a, b) => b.wrong.length - a.wrong.length);
  for (const r of rows) {
    if (!r.wrong || r.wrong === r.right) continue;
    out = out.split(r.wrong).join(r.right);
  }
  return out;
}

function tokenize(s: string): string[] {
  return s.split(/\s+/).filter(Boolean);
}

// Word-level diff (LCS) so we can see exactly which words were replaced.
function diffPairs(a: string[], b: string[]): { wrong: string; right: string }[] {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0 || n > 800 || m > 800) return [];
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs: { wrong: string; right: string }[] = [];
  let i = 0;
  let j = 0;
  let bufA: string[] = [];
  let bufB: string[] = [];
  const flush = () => {
    // Only keep short, focused substitutions — long ones are rewrites, not
    // vocabulary fixes, and would poison the dictionary.
    if (bufA.length > 0 && bufB.length > 0 && bufA.length <= 3 && bufB.length <= 3) {
      pairs.push({ wrong: bufA.join(" "), right: bufB.join(" ") });
    }
    bufA = [];
    bufB = [];
  };
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      flush();
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      bufA.push(a[i++]);
    } else {
      bufB.push(b[j++]);
    }
  }
  while (i < n) bufA.push(a[i++]);
  while (j < m) bufB.push(b[j++]);
  flush();
  return pairs;
}

// Called when the user edits a transcript before scoring.
export async function learnFromEdit(original: string, corrected: string) {
  if (!original || !corrected || original === corrected) return { learned: 0, terms: 0 };
  const pairs = diffPairs(tokenize(original), tokenize(corrected));
  let learned = 0;
  let terms = 0;
  for (const p of pairs) {
    const wrong = p.wrong.trim();
    const right = p.right.trim();
    if (wrong.length < 2 || right.length < 2) continue;
    if (wrong.length > 40 || right.length > 40) continue;
    await prisma.correction.upsert({
      where: { wrong_right: { wrong, right } },
      update: { count: { increment: 1 } },
      create: { wrong, right },
    });
    learned++;
    // The corrected word is worth priming the model with next time.
    if (!right.includes(" ")) {
      await addTerm(right, "term", "learned");
      terms++;
    }
  }
  return { learned, terms };
}
