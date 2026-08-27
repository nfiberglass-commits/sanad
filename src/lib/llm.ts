import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import path from "path";
import { currentModel } from "./settings";

// Resolved per call so the Settings-page model switch applies immediately.
export function MODEL(): string {
  return currentModel();
}

export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the app."
    );
  }
  return new Anthropic({ apiKey });
}

// Prompts are versioned files in /prompts (spec §8) — never inline in code.
export function loadPrompt(name: string, vars: Record<string, string> = {}): string {
  const file = path.join(process.cwd(), "prompts", `${name}.md`);
  let text = readFileSync(file, "utf-8");
  for (const [k, v] of Object.entries(vars)) {
    text = text.split(`{${k}}`).join(v);
  }
  return text;
}

// Models sometimes wrap JSON in prose or code fences — extract defensively.
export function extractJson<T = unknown>(text: string): T {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(t.slice(start, end + 1)) as T;
}

export function devLog(label: string, payload: unknown) {
  // §10.6 — log LLM payloads only in dev mode
  if (process.env.NODE_ENV !== "production") {
    console.log(`[llm:${label}]`, JSON.stringify(payload).slice(0, 2000));
  }
}
