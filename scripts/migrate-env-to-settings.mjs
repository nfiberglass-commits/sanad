// One-time move: APP_PASSWORD + SELF_ALIASES leave .env.local and become
// settings the app owns (data/settings.json), so nobody has to hand-edit an
// env file. Safe to run twice — it refuses if a password is already stored.
//
// Usage: node scripts/migrate-env-to-settings.mjs [SANAD-XXXX-XXXX-XXXX]
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { randomBytes, scryptSync } from "crypto";
import { mintLicenceKey, isValidLicenceFormat, normalizeLicenceKey } from "../src/lib/licence.ts";

const root = path.resolve(import.meta.dirname, "..");
const envPath = path.join(root, ".env.local");
const settingsPath = path.join(root, "data", "settings.json");
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function readEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = readEnv(envPath);
const settings = existsSync(settingsPath)
  ? JSON.parse(readFileSync(settingsPath, "utf-8"))
  : {};

if (settings.auth?.hash) {
  console.log("Already migrated — data/settings.json holds a password. Nothing to do.");
  process.exit(0);
}
if (!env.APP_PASSWORD) {
  console.error("No APP_PASSWORD in .env.local — run the /setup wizard instead.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
settings.auth = {
  algo: "scrypt",
  salt,
  hash: scryptSync(env.APP_PASSWORD, salt, 64).toString("hex"),
};
settings.selfAliases = (env.SELF_ALIASES ?? "")
  .split(/[,\n]/)
  .map((s) => s.trim())
  .filter(Boolean);
settings.displayName = settings.displayName || settings.selfAliases[0] || "";

const arg = process.argv[2];
if (arg && !isValidLicenceFormat(arg)) {
  console.error(`"${arg}" is not a valid licence key.`);
  process.exit(1);
}
const rand = (n) =>
  Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
settings.licenceKey = arg ? normalizeLicenceKey(arg) : mintLicenceKey(rand(4), rand(4));
settings.setupCompletedAt = new Date().toISOString();

mkdirSync(path.dirname(settingsPath), { recursive: true });
writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

// Strip the two moved keys from .env.local, keeping a copy of the original.
copyFileSync(envPath, envPath + ".before-setup-migration");
const kept = readFileSync(envPath, "utf-8")
  .split(/\r?\n/)
  .filter((l) => !/^\s*(APP_PASSWORD|SELF_ALIASES)\s*=/.test(l))
  .join("\n");
writeFileSync(envPath, kept.replace(/\n{3,}/g, "\n\n"));

console.log("Moved into data/settings.json:");
console.log("  password  -> scrypt hash (same password still works)");
console.log("  aliases   -> " + settings.selfAliases.join(" | "));
console.log("  licence   -> " + settings.licenceKey);
console.log("Backup of the old env file: .env.local.before-setup-migration");
console.log("Restart the dev server, then log in again (the session cookie changed).");
