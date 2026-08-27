import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClient, MODEL, loadPrompt } from "@/lib/llm";
import { computeMetrics, type Segment } from "@/lib/speechMetrics";
import { learnFromEdit } from "@/lib/vocab";
import { recomputeVoiceBaseline } from "@/lib/voiceBaseline";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  exercise: z.string().max(300),
  transcript: z.string().min(2).max(20000),
  durationSec: z.number().min(0).max(3600),
  segments: z
    .array(z.object({ start: z.number(), end: z.number(), text: z.string() }))
    .max(2000),
  edited: z.boolean().optional(),
  originalTranscript: z.string().max(20000).optional(),
  tone: z.record(z.string(), z.unknown()).nullable().optional(),
  audioPath: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { exercise, transcript, durationSec, segments, edited, originalTranscript, tone, audioPath } =
    parsed.data;
  // The user just told us the right words — remember them.
  if (edited && originalTranscript) {
    await learnFromEdit(originalTranscript, transcript).catch(() => {});
  }
  // Recompute from the FINAL text — if the user corrected the transcript, the
  // numbers must describe what they actually said.
  const metrics = computeMetrics(transcript, segments as Segment[], durationSec);
  const toneObj = tone as { available?: boolean; long_pauses?: number; longest_pause_sec?: number } | null | undefined;
  if (toneObj?.available && typeof toneObj.long_pauses === "number") {
    metrics.longPauses = toneObj.long_pauses;
    metrics.longestPauseSec = toneObj.longest_pause_sec ?? metrics.longestPauseSec;
  }

  let client;
  try {
    client = getClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "LLM not configured" },
      { status: 503 }
    );
  }

  const res = await client.messages.create({
    model: MODEL(),
    max_tokens: 1500,
    system: loadPrompt("speech-coach"),
    messages: [
      {
        role: "user",
        content: `Exercise: ${exercise}${edited ? " (transcript was corrected by the speaker — treat it as accurate)" : ""}\n\nMetrics (computed in code): ${JSON.stringify(metrics)}

Voice/tone measurements (computed from the audio waveform): ${toneObj?.available ? JSON.stringify(toneObj) : "not available"}\n\nTranscript of the recording:\n\n${transcript}`,
      },
    ],
  });
  const feedback = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");

  const session = await prisma.session.create({
    data: {
      mode: "speech_drill",
      scenario: exercise,
      transcript,
      audioPath: audioPath ?? null,
      metrics: JSON.stringify({ ...metrics, tone: toneObj ?? null }),
      debrief: feedback,
    },
  });

  // Each drill refines this user's own range, so the next one is judged
  // against a better picture of how they actually speak.
  await recomputeVoiceBaseline().catch(() => {});

  return NextResponse.json({ sessionId: session.id, feedback, metrics });
}
