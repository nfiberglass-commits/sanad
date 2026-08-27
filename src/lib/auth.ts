import { createHash, timingSafeEqual } from "crypto";
import { readAppSettings, writeAppSettings } from "./settings";
import { hashPassword, verifyPassword, tokenFromRecord } from "./password";

export const COOKIE_NAME = "commcoach_session";
const SALT = "commcoach-v1";

// The password now lives in data/settings.json (written by the /setup wizard),
// hashed with scrypt. .env.local APP_PASSWORD is still honoured so installs
// made before the wizard keep working untouched.
// Single local user — no user table.

function legacyEnvPassword(): string {
  return process.env.APP_PASSWORD ?? "";
}

/** The session cookie holds a hash derived from the password, so changing the
 * password invalidates existing sessions. */
export function sessionToken(): string {
  const rec = readAppSettings().auth;
  if (rec) return tokenFromRecord(rec, SALT);
  return createHash("sha256").update(`${legacyEnvPassword()}:${SALT}`).digest("hex");
}

export function passwordMatches(candidate: string): boolean {
  const rec = readAppSettings().auth;
  if (rec) return verifyPassword(candidate, rec);

  const expected = legacyEnvPassword();
  if (!expected) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** True when the app can authenticate on its own (settings or legacy env). */
export function passwordIsConfigured(): boolean {
  return Boolean(readAppSettings().auth?.hash || legacyEnvPassword());
}

/** Store a new password. Returns the session token for the NEW password. */
export function setPassword(plain: string): string {
  const rec = hashPassword(plain);
  writeAppSettings({ auth: rec });
  return tokenFromRecord(rec, SALT);
}

export function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  const expected = sessionToken();
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
