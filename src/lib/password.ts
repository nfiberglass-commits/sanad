import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";

// Password storage for the single local user. Kept pure (no file access) so it
// can be unit-tested; the stored record lives in data/settings.json.

export interface PasswordRecord {
  algo: "scrypt";
  salt: string; // hex
  hash: string; // hex
}

const KEYLEN = 64;

export { MIN_PASSWORD_LENGTH } from "./policy";

export function hashPassword(plain: string): PasswordRecord {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, KEYLEN).toString("hex");
  return { algo: "scrypt", salt, hash };
}

export function verifyPassword(plain: string, rec: PasswordRecord | undefined): boolean {
  if (!rec || rec.algo !== "scrypt" || !rec.salt || !rec.hash) return false;
  const expected = Buffer.from(rec.hash, "hex");
  const actual = scryptSync(plain, rec.salt, expected.length);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

// The session cookie is derived from the stored hash, so changing the password
// invalidates every existing session — same behaviour as the old env version,
// which derived it from APP_PASSWORD itself.
export function tokenFromRecord(rec: PasswordRecord | undefined, salt: string): string {
  return createHash("sha256")
    .update(`${rec ? `${rec.algo}:${rec.salt}:${rec.hash}` : ""}:${salt}`)
    .digest("hex");
}
