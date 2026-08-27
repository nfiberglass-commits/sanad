// Measure REAL token counts for each kind of Sanad API call, using the free
// count_tokens endpoint and Ahmed's own data. No generation, no cost.
import { readFileSync } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import Anthropic from "@anthropic-ai/sdk";

const root = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(path.join(root, ".env.local"), "utf-8")
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")])
);

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const MODEL = "claude-opus-5";
const prompt = (n) => readFileSync(path.join(root, "prompts", `${n}.md`), "utf-8");

const db = new DatabaseSync(path.join(root, "data", "commcoach.db"));

async function count(label, { system, messages, tools }) {
  const res = await client.messages.countTokens({ model: MODEL, system, messages, ...(tools ? { tools } : {}) });
  console.log(`${label}\t${res.input_tokens}`);
  return res.input_tokens;
}

// --- 1. Profile generation: one batch of 150 real messages ---
const msgs = db
  .prepare("SELECT source, lang, counterpart, sentAt, content FROM Message WHERE author='self' LIMIT 150")
  .all();
const batch = msgs
  .map((m, i) => `${i + 1}. [${m.source} | ${m.lang} | to ${m.counterpart ?? "?"} | ${String(m.sentAt).slice(0, 10)}] ${m.content}`)
  .join("\n");
const profileBatch = await count("profile_batch_150msgs", {
  system: prompt("profile-analyzer"),
  messages: [{ role: "user", content: batch }],
  tools: [{ name: "save_result", description: "Save the final analysis result object.", input_schema: { type: "object" } }],
});

// --- 2. Speech feedback: prompt + a real drill transcript ---
const drill = db
  .prepare("SELECT transcript FROM Session WHERE mode='speech_drill' ORDER BY length(transcript) DESC LIMIT 1")
  .get();
await count("speech_feedback", {
  system: prompt("speech-coach"),
  messages: [{ role: "user", content: drill?.transcript ?? "" }],
});

// --- 3. Roleplay: system + a real roleplay session's turns (worst case = full session) ---
const rp = db
  .prepare("SELECT transcript FROM Session WHERE mode='roleplay' ORDER BY length(transcript) DESC LIMIT 1")
  .get();
let turns = [];
try {
  turns = JSON.parse(rp?.transcript ?? "[]");
} catch {}
const rpMessages = Array.isArray(turns) && turns.length
  ? turns.map((t) => ({ role: t.role === "assistant" ? "assistant" : "user", content: String(t.content ?? "") }))
  : [{ role: "user", content: "(Scene begins.)" }];
if (rpMessages[rpMessages.length - 1].role === "assistant") rpMessages.push({ role: "user", content: "(Continue in character.)" });
await count(`roleplay_last_turn_of_${rpMessages.length}`, {
  system: prompt("roleplay-counterpart"),
  messages: rpMessages,
});

// --- 4. Debrief: prompt + the same full transcript ---
await count("debrief", {
  system: prompt("debrief-coach"),
  messages: [{ role: "user", content: JSON.stringify(turns) }],
});

// --- 5. Bare system prompts, for reference ---
for (const p of ["profile-analyzer", "speech-coach", "roleplay-counterpart", "debrief-coach", "coach-pause"]) {
  await count(`system_only:${p}`, { system: prompt(p), messages: [{ role: "user", content: "." }] });
}

// --- 6. Arabic chars-per-token ratio, measured on his own text ---
const sample = msgs.map((m) => m.content).join("\n").slice(0, 4000);
const t = await client.messages.countTokens({ model: MODEL, messages: [{ role: "user", content: sample }] });
console.log(`arabic_chars_per_token\t${(sample.length / t.input_tokens).toFixed(2)}`);
console.log(`profile_batches_for_600_msgs\t${Math.ceil(600 / 150)}`);
console.log(`profile_batch_tokens\t${profileBatch}`);
