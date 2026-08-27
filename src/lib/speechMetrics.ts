// Deterministic speech metrics (spec §F4) — computed in code, never by the
// LLM. The LLM only interprets them.

export interface Segment {
  start: number;
  end: number;
  text: string;
}

export interface SpeechMetrics {
  durationSec: number;
  wordCount: number;
  wpm: number;
  fillerCounts: Record<string, number>;
  totalFillers: number;
  fillersPerMinute: number;
  longPauses: number; // silences > 2.5s between segments
  longestPauseSec: number;
}

// Configurable filler lists (spec defaults + measured personal tics)
export const FILLERS_EN = ["um", "uh", "like", "you know", "actually", "basically"];
export const FILLERS_AR = ["يعني", "اه", "أه", "طبعا", "بصراحة", "فا", "بس"];

function normalizeArabic(s: string): string {
  return s.replace(/[أإآ]/g, "ا").replace(/[ً-ٰٟ]/g, "");
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function countFillers(text: string): Record<string, number> {
  const norm = normalizeArabic(text.toLowerCase());
  const counts: Record<string, number> = {};

  // Variants that normalize to the same word (اه / أه) must be counted ONCE,
  // otherwise every occurrence is counted per-variant and the total doubles.
  const seenTargets = new Set<string>();
  const uniqueFillers = [...FILLERS_EN, ...FILLERS_AR].filter((f) => {
    const key = normalizeArabic(f.toLowerCase());
    if (seenTargets.has(key)) return false;
    seenTargets.add(key);
    return true;
  });

  for (const f of uniqueFillers) {
    const target = normalizeArabic(f.toLowerCase());
    // word-boundary match that works for Arabic: split on non-letter chars
    const words = norm.split(/[^\p{L}\p{N}']+/u);
    let n = 0;
    if (target.includes(" ")) {
      // multi-word filler ("you know")
      const re = new RegExp(`(?:^|\\s)${target}(?:\\s|$)`, "g");
      n = (norm.match(re) ?? []).length;
    } else {
      n = words.filter((w) => w === target).length;
    }
    if (n > 0) counts[f] = n;
  }
  return counts;
}

export function computePauses(segments: Segment[]): { longPauses: number; longestPauseSec: number } {
  let longPauses = 0;
  let longest = 0;
  for (let i = 1; i < segments.length; i++) {
    const gap = segments[i].start - segments[i - 1].end;
    if (gap > longest) longest = gap;
    if (gap > 2.5) longPauses++;
  }
  return { longPauses, longestPauseSec: Math.round(longest * 10) / 10 };
}

export function computeMetrics(
  text: string,
  segments: Segment[],
  durationSec: number
): SpeechMetrics {
  const wordCount = countWords(text);
  const minutes = durationSec > 0 ? durationSec / 60 : 1;
  const fillerCounts = countFillers(text);
  const totalFillers = Object.values(fillerCounts).reduce((a, b) => a + b, 0);
  const { longPauses, longestPauseSec } = computePauses(segments);
  return {
    durationSec: Math.round(durationSec * 10) / 10,
    wordCount,
    wpm: Math.round(wordCount / minutes),
    fillerCounts,
    totalFillers,
    fillersPerMinute: Math.round((totalFillers / minutes) * 10) / 10,
    longPauses,
    longestPauseSec,
  };
}
