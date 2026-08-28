import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClient, MODEL, loadPrompt } from "@/lib/llm";
import { getScenario } from "@/lib/scenarios";
import { latestProfile, focusAreas } from "@/lib/profile";

export const runtime = "nodejs";
export const maxDuration = 120;

const RELATIONSHIP_CONTEXT: Record<string, string> = {
  peer: "You are COLLEAGUES at the same level — no authority either way. Negotiation between equals; saving face matters on both sides; escalating to a boss would be a failure for both.",
  manager_down:
    "The user is YOUR MANAGER and you are on their team. You respect their authority but you have feelings, workload, and pride — you comply outwardly even when unconvinced, and only truly engage when treated with respect and given the why.",
  member_up:
    "YOU are the USER'S MANAGER — you hold the authority. The user is practicing upward communication: disagreeing respectfully, asking for resources, raising problems. You are busy, expect the point first, and push back with authority — but respect well-argued, respectful firmness.",
};

const Body = z.object({
  scenarioId: z.string(),
  difficulty: z.number().int().min(1).max(5),
  relationship: z.enum(["peer", "manager_down", "member_up"]).optional(),
  customSituation: z.string().max(2000).optional(),
  coach: z.boolean().optional(), // "pause & coach" mode
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .max(30),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { scenarioId, difficulty, relationship, customSituation, coach, messages } =
    parsed.data;
  let scenario = getScenario(scenarioId);
  if (!scenario && scenarioId === "custom" && customSituation) {
    scenario = {
      id: "custom",
      title: "Custom situation",
      titleAr: "موقف خاص",
      situation: customSituation,
      situationAr: customSituation,
      persona:
        "The exact counterpart described in the situation. Infer their character, mood, and interests from the description and play them realistically.",
      hiddenObjectives: [
        "Protect your own interests and feelings as that person naturally would",
        "Only soften when the user communicates with clarity, respect, and a real why",
      ],
      pressureMoments: [
        "Push back once on the user's main request",
        "Show the emotion the described conflict would realistically produce",
        "Test whether the user listens by referencing something you said earlier",
      ],
      defaultDifficulty: difficulty,
    };
  }
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 404 });
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

  const profile = await latestProfile();
  const focus = focusAreas(profile?.json);

  let system: string;
  if (coach) {
    system = loadPrompt("coach-pause");
  } else {
    system = loadPrompt("roleplay-counterpart", {
      persona: scenario.persona,
      scenario: scenario.title,
      situation: scenario.situation,
      relationship_context:
        RELATIONSHIP_CONTEXT[relationship ?? ""] ??
        "As implied by the situation description.",
      difficulty: String(difficulty),
      hidden_objectives: scenario.hiddenObjectives.map((o) => `- ${o}`).join("\n"),
      pressure_moments: scenario.pressureMoments.map((p) => `- ${p}`).join("\n"),
      focus_areas: focus.length > 0 ? focus.join("; ") : "not measured yet",
    });
  }

  // Anthropic requires a user-first, user-last message list.
  let apiMessages: { role: "user" | "assistant"; content: string }[];
  if (coach) {
    // Coach mode: hand over the whole transcript as one user message.
    const transcript = messages
      .map((m) => `${m.role === "user" ? "USER" : "COUNTERPART"}: ${m.content}`)
      .join("\n\n");
    apiMessages = [
      {
        role: "user",
        content: `Roleplay transcript so far:\n\n${transcript}\n\nGive your instant coaching feedback on the user's last message now (if the user hasn't spoken yet, give one tip on how to open strong).`,
      },
    ];
  } else {
    const history =
      messages.length > 0
        ? [...messages]
        : [{ role: "user" as const, content: "(The user enters. Open the scene in character.)" }];
    if (history[0].role === "assistant") {
      history.unshift({ role: "user", content: "(Scene begins.)" });
    }
    if (history[history.length - 1].role === "assistant") {
      history.push({ role: "user", content: "(Continue in character.)" });
    }
    apiMessages = history;
  }

  const stream = client.messages.stream({
    model: MODEL(),
    max_tokens: 1024,
    system,
    messages: apiMessages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (t) => controller.enqueue(encoder.encode(t)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => {
        controller.enqueue(encoder.encode(`\n[error: ${err.message}]`));
        controller.close();
      });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
