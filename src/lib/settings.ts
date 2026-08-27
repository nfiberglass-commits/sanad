import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import type { PasswordRecord } from "./password";

// Small runtime-editable settings, stored next to the DB.
//
// Everything the CUSTOMER has to provide lives here, not in .env.local — a CEO
// will not hand-edit an env file. The first-run wizard (/setup) writes it.
// Env is kept only as a fallback so older installs keep working.
export interface AppSettings {
  model?: string;
  // --- first-run setup (see /setup) ---
  /** Password record for the single local user. Replaces APP_PASSWORD. */
  auth?: PasswordRecord;
  /** Every name the user appears as in their chat exports. Replaces SELF_ALIASES. */
  selfAliases?: string[];
  /** What we call them in the UI. */
  displayName?: string;
  /** Licence key, format-checked today, gateway-checked once that exists. */
  licenceKey?: string;
  /** ISO timestamp — presence of this plus a password means setup is done. */
  setupCompletedAt?: string;
  /** Ahmed's own install. Unlocks owner-only pages (business model). Never set
   * on a customer build — the wizard does not write it. */
  ownerMode?: boolean;
  /** Demonstration copy: the data inside is invented. Puts a visible badge on
   * every screen so a demo is never mistaken for a real install. */
  demoMode?: boolean;
  // The user's OWN speaking baseline, measured from their real recordings.
  // Judging "flat delivery" against a generic threshold is wrong — everyone
  // has a different natural range, so we compare the user to themselves.
  voiceBaseline?: {
    medianVariationSt: number; // their normal pitch movement
    lowVariationSt: number; // 10th percentile — below this is unusually flat FOR THEM
    medianSpeakingRatio: number;
    targetVariationSt?: number; // the goal: their own top-25% level
    stretchVariationSt?: number; // their own top-10% level
    sampleSize: number;
    measuredAt: string;
  };
}

const FILE = path.join(process.cwd(), "data", "settings.json");

export function settingsPath(): string {
  return FILE;
}

export function readAppSettings(): AppSettings {
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as AppSettings;
  } catch {
    return {};
  }
}

export function writeAppSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...readAppSettings(), ...patch };
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(next, null, 2));
  return next;
}

export const MODELS = [
  { id: "claude-sonnet-5", label: "Sonnet 5 — fast, low cost" },
  { id: "claude-opus-5", label: "Opus 5 — strongest, higher cost" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5 — cheapest, lighter" },
] as const;

export function currentModel(): string {
  return (
    readAppSettings().model ||
    process.env.ANTHROPIC_MODEL ||
    "claude-sonnet-5"
  );
}

export function parseAliasList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

/** Names that count as "me" when parsing a chat export. Settings first, env as fallback. */
export function selfAliases(): string[] {
  const fromSettings = readAppSettings().selfAliases;
  if (fromSettings && fromSettings.length > 0) return fromSettings;
  return parseAliasList(process.env.SELF_ALIASES ?? "");
}

/**
 * Setup is done when the app can log the user in on its own.
 * A legacy install with APP_PASSWORD in .env.local counts as done, so nobody
 * gets thrown into the wizard after an update.
 */
/** True on a demonstration copy — shows the DEMO badge. */
export function isDemo(): boolean {
  return readAppSettings().demoMode === true;
}

/** True only on the owner's own copy. Customer installs never set this. */
export function isOwner(): boolean {
  return readAppSettings().ownerMode === true;
}

export function isSetupComplete(s: AppSettings = readAppSettings()): boolean {
  if (s.auth?.hash) return true;
  return Boolean(process.env.APP_PASSWORD);
}
