import { prisma } from "./db";
import { readAppSettings, writeAppSettings } from "./settings";

// Every speaker has a different natural pitch range, so "flat" can only be
// judged against THAT person's own recordings. This rebuilds each user's
// baseline from their own speech sessions as they accumulate.

const MIN_SESSIONS = 5; // below this, judging someone's range is guesswork

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return Math.round(sorted[i] * 100) / 100;
}

export async function recomputeVoiceBaseline(): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: { mode: "speech_drill" },
    select: { metrics: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const variations: number[] = [];
  const ratios: number[] = [];
  for (const s of sessions) {
    if (!s.metrics) continue;
    try {
      const m = JSON.parse(s.metrics) as {
        tone?: {
          available?: boolean;
          pitch?: { variation_st?: number };
          speaking_ratio?: number;
        };
      };
      const v = m.tone?.pitch?.variation_st;
      if (m.tone?.available && typeof v === "number" && v > 0) variations.push(v);
      if (typeof m.tone?.speaking_ratio === "number") ratios.push(m.tone.speaking_ratio);
    } catch {
      // a malformed row must never block the rest
    }
  }

  if (variations.length < MIN_SESSIONS) return;

  variations.sort((a, b) => a - b);
  ratios.sort((a, b) => a - b);

  const existing = readAppSettings().voiceBaseline;
  // A baseline seeded from a large historical corpus beats a handful of
  // practice clips — only replace it once there is more evidence.
  if (existing && existing.sampleSize > variations.length) return;

  writeAppSettings({
    voiceBaseline: {
      medianVariationSt: percentile(variations, 0.5),
      lowVariationSt: percentile(variations, 0.1),
      medianSpeakingRatio: ratios.length ? percentile(ratios, 0.5) : 0.6,
      targetVariationSt: percentile(variations, 0.75),
      stretchVariationSt: percentile(variations, 0.9),
      sampleSize: variations.length,
      measuredAt: new Date().toISOString().slice(0, 10),
    },
  });
}
