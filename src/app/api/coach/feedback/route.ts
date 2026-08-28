import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClient, MODEL, loadPrompt, extractJson } from "@/lib/llm";
import { getScenario } from "@/lib/scenarios";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  scenarioId: z.string(),
  difficulty: z.number().int().min(1).max(5),
  relationship: z.enum(["peer", "manager_down", "member_up"]).optional(),
  customSituation: z.string().max(2000).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(2)
    .max(200),
});

interface AxisScore {
  score: number | null;
  quote: string;
}

interface DebriefJson {
  done_well: { text: string; quote: string };
  scores: Record<string, AxisScore>;
  rewrites: { original: string; improved: string }[];
  next_drill: string;
  debrief_markdown: string;
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { scenarioId, difficulty, relationship, customSituation, messages } = parsed.data;
  const scenario = getScenario(scenarioId);
  const scenarioTitle = scenario
    ? scenario.title
    : scenarioId === "custom" && customSituation
      ? `Custom: ${customSituation.slice(0, 80)}`
      : null;
  if (!scenarioTitle) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 404 });
  }
  const relationshipNote =
    relationship === "peer"
      ? "The user and the counterpart are peers/colleagues."
      : relationship === "manager_down"
        ? "The user is the manager; the counterpart is on their team."
        : relationship === "member_up"
          ? "The counterpart is the user's manager; the user practiced upward communication."
          : "";

  let client;
  try {
    client = getClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "LLM not configured" },
      { status: 503 }
    );
  }

  const transcript = messages
    .map((m) => `${m.role === "user" ? "USER" : "COUNTERPART"}: ${m.content}`)
    .join("\n\n");

  // The model occasionally wraps or truncates the JSON. Retry once
  // server-side before surfacing an error — the user should never have to
  // press the button twice for a formatting hiccup.
  let debrief: DebriefJson | null = null;
  for (let attempt = 0; attempt < 2 && !debrief; attempt++) {
    const res = await client.messages.create({
      model: MODEL(),
      max_tokens: 8000,
      system: loadPrompt("debrief-coach"),
      messages: [
        {
          role: "user",
          content: `Scenario: ${scenarioTitle} (difficulty ${difficulty}/5, text mode — presence_delivery score must be null). ${relationshipNote}\n\nSession transcript:\n\n${transcript}`,
        },
      ],
    });
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    try {
      debrief = extractJson<DebriefJson>(text);
    } catch {
      // fall through to the retry; error only after the second miss
    }
  }
  if (!debrief) {
    return NextResponse.json(
      { error: "Coach response was not valid JSON — try ending the session again." },
      { status: 502 }
    );
  }

  // Session score = average of non-null axes (weights default equal, §5)
  const numeric = Object.values(debrief.scores)
    .map((a) => a.score)
    .filter((s): s is number => typeof s === "number");
  const overall =
    numeric.length > 0
      ? Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10) / 10
      : null;

  const session = await prisma.session.create({
    data: {
      mode: "roleplay",
      scenario: scenarioTitle,
      transcript: JSON.stringify({ scenarioId, difficulty, relationship, customSituation, messages }),
      scores: JSON.stringify({ overall, axes: debrief.scores }),
      debrief: debrief.debrief_markdown,
    },
  });

  return NextResponse.json({ sessionId: session.id, overall, ...debrief });
}
