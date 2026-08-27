import { prisma } from "./db";
import { anonymizeTexts } from "./anonymize";
import { getClient, MODEL, loadPrompt, extractJson, devLog } from "./llm";

// §F2 — Communication Style Profile engine.
// Prompt-size discipline: sampled batches of 150 messages, map-reduce merge.

const BATCH_SIZE = 150;
const MAX_MESSAGES = 600;
const MIN_MESSAGES = 20;

export interface ProfileDimension {
  score: number | null;
  evidence: string[];
  notes: string;
}

export interface StyleProfileJson {
  generated_at: string;
  sample_size: { whatsapp: number; email: number; transcripts: number };
  dimensions: Record<string, ProfileDimension | { notes: string }>;
  habits: {
    strengths: string[];
    weaknesses: string[];
    verbal_tics: string[];
    filler_words: string[];
  };
  context_patterns: { with_team: string; with_clients: string; under_pressure: string };
  top_3_focus_areas: string[];
}

function formatBatch(
  msgs: { content: string; lang: string; source: string; counterpart: string | null; sentAt: Date | null }[],
  anonymized: string[]
): string {
  return msgs
    .map((m, i) => {
      const date = m.sentAt ? m.sentAt.toISOString().slice(0, 10) : "?";
      return `${i + 1}. [${m.source} | ${m.lang} | to ${m.counterpart ?? "?"} | ${date}] ${anonymized[i]}`;
    })
    .join("\n");
}

// Force the result through a tool call — the API guarantees the tool input is
// valid JSON, so Arabic quotes inside strings can't break parsing.
async function callForJson<T>(
  client: ReturnType<typeof getClient>,
  system: string,
  userContent: string
): Promise<{ parsed: T; raw: string }> {
  const res = await client.messages.create({
    model: MODEL(),
    max_tokens: 20000,
    system,
    tools: [
      {
        name: "save_result",
        description:
          "Save the final analysis result object. The input must follow the JSON schema described in the instructions.",
        input_schema: { type: "object" as const },
      },
    ],
    tool_choice: { type: "tool", name: "save_result" },
    messages: [{ role: "user", content: userContent }],
  });
  const toolBlock = res.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Model did not return a structured result");
  }
  const parsed = unwrapResult(toolBlock.input) as T;
  return { parsed, raw: JSON.stringify(parsed) };
}

// Models sometimes nest the payload under a lone "result" key in tool input.
function unwrapResult(v: unknown): unknown {
  if (
    v &&
    typeof v === "object" &&
    "result" in v &&
    Object.keys(v).length === 1 &&
    typeof (v as { result: unknown }).result === "object"
  ) {
    return (v as { result: unknown }).result;
  }
  return v;
}

export async function generateProfile(): Promise<{ id: string; version: number; json: StyleProfileJson; sampleSize: number }> {
  const msgs = await prisma.message.findMany({
    where: { author: "self" },
    orderBy: [{ sentAt: "desc" }],
    take: MAX_MESSAGES,
  });

  if (msgs.length < MIN_MESSAGES) {
    throw new Error(
      `Not enough data: ${msgs.length} of your own messages ingested (minimum ${MIN_MESSAGES}). Upload more chats first.`
    );
  }

  const anonymized = await anonymizeTexts(msgs.map((m) => m.content));
  const client = getClient();
  const system = loadPrompt("profile-analyzer");

  // Map: one partial profile per batch
  const partials: string[] = [];
  for (let i = 0; i < msgs.length; i += BATCH_SIZE) {
    const slice = msgs.slice(i, i + BATCH_SIZE);
    const body = formatBatch(slice, anonymized.slice(i, i + BATCH_SIZE));
    devLog("profile-batch", { batch: i / BATCH_SIZE + 1, count: slice.length });
    const { raw } = await callForJson<StyleProfileJson>(
      client,
      system,
      `Here are ${slice.length} real messages written by the user (author = self). Analyze them and output the profile JSON.\n\n${body}`
    );
    partials.push(raw);
  }

  // Reduce: merge partial profiles into one (skip if single batch)
  let finalJson: StyleProfileJson;
  if (partials.length === 1) {
    finalJson = extractJson<StyleProfileJson>(partials[0]);
  } else {
    const { parsed } = await callForJson<StyleProfileJson>(
      client,
      system,
      `Below are ${partials.length} partial profile JSONs, each analyzing a different batch of the same person's messages. Merge them into ONE final profile JSON in the same schema. Scores: weigh consistently observed patterns higher. Evidence: keep the strongest verbatim quotes (max 3 per dimension). Output valid JSON only.\n\n${partials
        .map((p, i) => `--- PARTIAL ${i + 1} ---\n${p}`)
        .join("\n\n")}`
    );
    finalJson = parsed;
  }

  if (!finalJson.dimensions || Object.keys(finalJson.dimensions).length === 0) {
    throw new Error("Analysis returned an incomplete profile — run Generate again.");
  }

  // Stamp real counts (never trust the model with numbers)
  const bySource = { whatsapp: 0, email: 0, transcripts: 0 };
  for (const m of msgs) {
    if (m.source === "whatsapp") bySource.whatsapp++;
    else if (m.source.startsWith("email")) bySource.email++;
    else bySource.transcripts++;
  }
  finalJson.generated_at = new Date().toISOString();
  finalJson.sample_size = bySource;

  const latest = await prisma.styleProfile.findFirst({ orderBy: { version: "desc" } });
  const version = (latest?.version ?? 0) + 1;
  const row = await prisma.styleProfile.create({
    data: { version, json: JSON.stringify(finalJson), sampleSize: msgs.length },
  });
  return { id: row.id, version, json: finalJson, sampleSize: msgs.length };
}

export async function latestProfile(): Promise<{ version: number; json: StyleProfileJson; createdAt: Date; sampleSize: number } | null> {
  const row = await prisma.styleProfile.findFirst({ orderBy: { version: "desc" } });
  if (!row) return null;
  return {
    version: row.version,
    json: JSON.parse(row.json) as StyleProfileJson,
    createdAt: row.createdAt,
    sampleSize: row.sampleSize,
  };
}

export function focusAreas(json: StyleProfileJson | null | undefined): string[] {
  return json?.top_3_focus_areas ?? [];
}
