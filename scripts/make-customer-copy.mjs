// Build a clean copy of Sanad for someone who is not the owner — the demo
// install, Sara's laptop, or a paying customer.
//
//   node scripts/make-customer-copy.mjs "C:\\path\\to\\new-folder"
//   npm run copy:customer -- "..\\sanad-demo"
//
// TWO RULES THIS SCRIPT EXISTS TO ENFORCE:
//
// 1. ALLOW-LIST, never a delete-list. It copies the files named below into an
//    empty folder. Anything not named simply never travels. A delete-list is
//    how the API key ends up shipped inside .next/ turbopack cache files whose
//    names change on every build.
//
// 2. It NEVER touches the source folder, and never deletes anything anywhere.
//    If the destination already has files in it, the script stops.
//
// It finishes by grepping its OWN OUTPUT for known secrets and exits non-zero
// if it finds any — the copy is not trusted until it has proved itself clean.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  copyFileSync,
  readFileSync,
} from "fs";
import path from "path";

const SRC = path.resolve(import.meta.dirname, "..");
const DEST = path.resolve(process.argv[2] ?? path.join(SRC, "..", "sanad-demo"));

// --- what travels -----------------------------------------------------------
// Directories copied whole, minus the excluded names below.
const DIRS = ["src", "prompts", "prisma", "public", "tests", "demo-data", "scripts"];
// Individual files.
const FILES = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "vitest.config.ts",
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  ".env.example",
  ".gitignore",
  "Start-Sanad.bat",
];
// Only these two docs. Business-Model-*.md carries pricing, margins and the
// security to-do list — it must never leave this machine.
const DOCS = ["Connect-WhatsApp-Guide-EN.md", "Connect-WhatsApp-Guide-AR.md"];

// Never copied, at any depth.
const SKIP_NAMES = new Set(["__pycache__", "node_modules", ".next", "data", ".git", ".claude"]);
const SKIP_EXT = new Set([".pyc", ".db", ".db-journal", ".sqlite"]);

// --- what must never appear in the output ----------------------------------
// Values are read from the live files so the script stays correct when they
// change, rather than hardcoding a secret into a script that gets committed.
async function secretsToCheck() {
  const out = [];
  const add = (label, value) => {
    if (value && String(value).length > 6) out.push({ label, value: String(value) });
  };

  // Env values are only secret when the KEY says so. ANTHROPIC_MODEL and
  // DATABASE_URL legitimately appear in .env.example and in src/lib/settings.ts.
  const SECRET_KEY = /KEY|PASSWORD|SECRET|TOKEN|CLIENT_ID|IMAP_USER/i;
  for (const envFile of [".env.local", ".env.local.before-setup-migration"]) {
    const p = path.join(SRC, envFile);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf-8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)$/);
      if (m && SECRET_KEY.test(m[1])) {
        add(`${envFile}:${m[1]}`, m[2].replace(/^["']|["']$/g, "").trim());
      }
    }
  }

  const settings = path.join(SRC, "data", "settings.json");
  if (existsSync(settings)) {
    const s = JSON.parse(readFileSync(settings, "utf-8"));
    add("settings.licenceKey", s.licenceKey);
    add("settings.auth.hash", s.auth?.hash);
    add("settings.auth.salt", s.auth?.salt);
    add("settings.displayName", s.displayName);
    for (const a of s.selfAliases ?? []) add("settings.selfAlias", a);
  }

  // Real identities behind the pseudonyms. Checking for the literal string
  // "Contact " would flag the anonymiser's own source code instead.
  const dbPath = path.join(SRC, "data", "commcoach.db");
  if (existsSync(dbPath)) {
    try {
      const { DatabaseSync } = await import("node:sqlite");
      const db = new DatabaseSync(dbPath, { readOnly: true });
      for (const row of db.prepare("SELECT realName FROM Pseudonym").all()) {
        add("real contact", row.realName);
      }
    } catch {
      // node:sqlite unavailable — the structural checks below still apply.
    }
  }
  return out;
}

// Patterns that must not appear regardless of what the values above happen to
// be. Matched as regexes so this script's own prose about "sk-ant-api" is not
// mistaken for a leaked key.
const FORBIDDEN_PATTERNS = [
  { label: "an Anthropic API key", re: /sk-ant-api\d*-[A-Za-z0-9_-]{20,}/ },
  { label: "the owner's home path", re: /[A-Za-z]:\\Users\\amamo/i },
  // Obvious placeholders (201111111111) are how the test fixtures are written;
  // a real number will not repeat one digit six times.
  { label: "an Egyptian mobile number", re: /\b201[0-25]\d{8}\b/, allow: /(\d)\1{5}/ },
];

// --- copy -------------------------------------------------------------------
let copied = 0;
let bytes = 0;

function copyDir(relDir) {
  const from = path.join(SRC, relDir);
  if (!existsSync(from)) return;
  for (const entry of readdirSync(from)) {
    if (SKIP_NAMES.has(entry)) continue;
    const rel = path.join(relDir, entry);
    const abs = path.join(SRC, rel);
    const st = statSync(abs);
    if (st.isDirectory()) {
      copyDir(rel);
    } else {
      if (SKIP_EXT.has(path.extname(entry))) continue;
      copyFile(rel);
    }
  }
}

function copyFile(rel) {
  const from = path.join(SRC, rel);
  if (!existsSync(from)) return;
  const to = path.join(DEST, rel);
  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(from, to);
  copied++;
  bytes += statSync(from).size;
}

// --- verify -----------------------------------------------------------------
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) walk(abs, out);
    else out.push(abs);
  }
  return out;
}

async function verify() {
  const problems = [];

  for (const forbidden of ["data", ".next", "node_modules", ".env", ".env.local"]) {
    if (existsSync(path.join(DEST, forbidden))) {
      problems.push(`${forbidden} exists in the copy — it must not`);
    }
  }
  if (existsSync(path.join(DEST, "docs", "Business-Model-EN.md")) ||
      existsSync(path.join(DEST, "docs", "Business-Model-AR.md"))) {
    problems.push("docs/Business-Model-*.md is in the copy — pricing and margins must not travel");
  }

  const secrets = await secretsToCheck();
  const files = walk(DEST);
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const rel = path.relative(DEST, file);
    for (const { label, value } of secrets) {
      if (text.includes(value)) problems.push(`${rel} contains ${label}`);
    }
    for (const { label, re, allow } of FORBIDDEN_PATTERNS) {
      const hit = text.match(re);
      if (hit && !(allow && allow.test(hit[0]))) {
        problems.push(`${rel} contains ${label}`);
      }
    }
  }
  return { problems, fileCount: files.length };
}

// --- run --------------------------------------------------------------------
if (DEST.startsWith(SRC + path.sep) || DEST === SRC) {
  console.error(`Refusing to write inside the source folder.\n  source: ${SRC}\n  dest:   ${DEST}`);
  process.exit(1);
}
if (existsSync(DEST) && readdirSync(DEST).length > 0) {
  console.error(
    `Destination is not empty: ${DEST}\n` +
      `This script never deletes anything. Choose an empty folder, or move that one aside yourself.`
  );
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });
for (const d of DIRS) copyDir(d);
for (const f of FILES) copyFile(f);
for (const d of DOCS) copyFile(path.join("docs", d));

const { problems, fileCount } = await verify();

console.log(`\nClean copy built:  ${DEST}`);
console.log(`  ${copied} files · ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  source folder untouched: ${SRC}`);

if (problems.length) {
  console.error(`\n❌ NOT SAFE TO HAND OVER — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`   · ${p}`);
  console.error(`\nFix the allow-list and build again into a fresh folder.`);
  process.exit(1);
}

console.log(`\n✅ Checked all ${fileCount} copied files: no key, no licence, no password hash,`);
console.log(`   no owner path, no pseudonyms, no database, no pricing docs.`);
console.log(`\nNext, in the new folder:`);
console.log(`   npm install`);
console.log(`   npm run db:push`);
console.log(`   Start-Sanad.bat`);
