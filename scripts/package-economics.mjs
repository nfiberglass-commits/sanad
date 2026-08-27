// What a Sanad customer actually costs to run, and what that leaves of the price.
//
// Token counts come from scripts/measure-token-costs.mjs (real count_tokens
// calls against a real database) — re-run that first if the prompts change.
// Everything below is arithmetic on those numbers; nothing is estimated except
// the clearly-labelled USAGE assumptions.
//
//   node scripts/package-economics.mjs
//   node scripts/package-economics.mjs --usd 52 --sessions-per-week 2

const args = Object.fromEntries(
  process.argv.slice(2).join(" ").split("--").filter(Boolean).map((s) => {
    const [k, ...v] = s.trim().split(/\s+/);
    return [k, v.join(" ")];
  })
);
const num = (k, d) => (args[k] !== undefined ? Number(args[k]) : d);

const USD_EGP = num("usd", 50);
const MONTHS = num("months", 6);
const WEEKS = MONTHS * 4.345;
const SESSIONS_PER_WEEK = num("sessions-per-week", 1);
const DRILLS_PER_WEEK = num("drills-per-week", 2);
const PROFILES = num("profiles", 2); // one at the start, one at the end (before/after)
const TURNS = num("turns", 12); // roleplay turns per session
const MARGIN_TARGET = num("margin-target", 0.7);

// --- measured, from scripts/measure-token-costs.mjs (21-08-2026) ---
const M = {
  profileBatchIn: 9746, // one batch of 150 real messages
  profileBatches: 4, // BATCH_SIZE 150, MAX_MESSAGES 600
  profileMergeIn: 13200, // 4 partial profiles + system
  profileOutPerCall: 3000, // max_tokens is 20000; real profiles land near this
  profileMergeOut: 4000,
  speechIn: 1489,
  speechOut: 700, // max_tokens 1500
  debriefIn: 1238,
  debriefOut: 800, // max_tokens 3000
  roleplaySystem: 485,
  roleplayTurnTokens: 160, // one user message + one reply, Arabic, measured ~1.56 chars/token
  roleplayOutPerTurn: 150, // max_tokens 1024
};

const PRICES = {
  "Opus 5": { in: 5, out: 25 },
  "Sonnet 5": { in: 3, out: 15 },
  "Haiku 4.5": { in: 1, out: 5 },
};

const egp = (usd) => usd * USD_EGP;
const cost = (model, inTok, outTok) =>
  egp((inTok / 1e6) * PRICES[model].in + (outTok / 1e6) * PRICES[model].out);

// A roleplay session resends the whole history every turn, so input grows with
// the SQUARE of the turn count. This is the number that bites.
function roleplayTokens(turns) {
  let input = 0;
  for (let t = 0; t < turns; t++) input += M.roleplaySystem + M.roleplayTurnTokens * t;
  return { input: input + M.debriefIn, output: turns * M.roleplayOutPerTurn + M.debriefOut };
}

const profileTokens = {
  input: M.profileBatchIn * M.profileBatches + M.profileMergeIn,
  output: M.profileOutPerCall * M.profileBatches + M.profileMergeOut,
};

const models = Object.keys(PRICES);
const fmt = (n) => n.toFixed(n < 10 ? 2 : 1);
const row = (cells, w = 16) => cells.map((c, i) => String(c).padEnd(i === 0 ? 34 : w)).join("");

console.log(`\nAssumptions: USD=${USD_EGP} EGP · ${MONTHS} months (${WEEKS.toFixed(0)} weeks) · ` +
  `${SESSIONS_PER_WEEK} session/week · ${DRILLS_PER_WEEK} drills/week · ${PROFILES} profiles · ${TURNS} turns/session\n`);

console.log("COST PER ACTIVITY (EGP)");
console.log(row(["", ...models]));
console.log(row(["profile build", ...models.map((m) => fmt(cost(m, profileTokens.input, profileTokens.output)))]));
const rp = roleplayTokens(TURNS);
console.log(row([`roleplay session (${TURNS} turns)`, ...models.map((m) => fmt(cost(m, rp.input, rp.output)))]));
console.log(row(["speech drill", ...models.map((m) => fmt(cost(m, M.speechIn, M.speechOut)))]));

console.log("\nHOW A SESSION SCALES WITH TURNS (EGP) — history is resent every turn");
console.log(row(["turns", ...models]));
for (const t of [6, 12, 24, 40, 60]) {
  const r = roleplayTokens(t);
  console.log(row([`${t} turns`, ...models.map((m) => fmt(cost(m, r.input, r.output)))]));
}

console.log(`\n${MONTHS}-MONTH PACKAGE COST PER CUSTOMER (EGP)`);
const sessions = Math.round(WEEKS * SESSIONS_PER_WEEK);
const drills = Math.round(WEEKS * DRILLS_PER_WEEK);
console.log(row(["", ...models]));
const light = {};
const full = {};
for (const m of models) {
  light[m] = PROFILES * cost(m, profileTokens.input, profileTokens.output) + sessions * cost(m, rp.input, rp.output);
  full[m] = light[m] + drills * cost(m, M.speechIn, M.speechOut);
}
console.log(row([`light (${sessions} sessions)`, ...models.map((m) => fmt(light[m]))]));
console.log(row([`full  (+ ${drills} drills)`, ...models.map((m) => fmt(full[m]))]));

console.log("\nSHARE OF THE PRICE (lower is better)");
const prices = [
  ["light @ 1200", 1200, light],
  ["full  @ 2400", 2400, full],
];
console.log(row(["", ...models]));
for (const [label, price, bucket] of prices) {
  console.log(row([label, ...models.map((m) => `${((bucket[m] / price) * 100).toFixed(0)}%`)]));
}

console.log(`\nWORST CASE — one user runs ${sessions} sessions of 60 turns instead of ${TURNS}:`);
const abuse = roleplayTokens(60);
for (const m of models) {
  const c = PROFILES * cost(m, profileTokens.input, profileTokens.output) + sessions * cost(m, abuse.input, abuse.output);
  console.log(`  ${m.padEnd(12)} ${fmt(c)} EGP  (${((c / 1200) * 100).toFixed(0)}% of a 1200 package)`);
}
console.log(`\nMargin target ${(MARGIN_TARGET * 100).toFixed(0)}% → running cost should stay under ` +
  `${fmt(1200 * (1 - MARGIN_TARGET))} EGP (light) / ${fmt(2400 * (1 - MARGIN_TARGET))} EGP (full).\n`);
