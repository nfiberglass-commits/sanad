// Licence keys for Sanad.
//
// ⚠ SCOPE: this file only checks that a key is WELL FORMED (shape + checksum).
// It is a typo guard, not a security boundary — the checksum is computed with
// plain JS so it can run in the browser, which means anyone reading the bundle
// could mint a key. The real check belongs in the licence gateway (Ahmed's
// server validates the key, meters usage and can revoke it). When that exists,
// add the network call here and keep this format check as the first gate.

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I, L, O, 0, 1
const PREFIX = "SANAD";
const GROUP = 4;

export const LICENCE_PLACEHOLDER = "SANAD-XXXX-XXXX-XXXX";

/** Uppercase, strip everything that is not in the alphabet, re-group. */
export function normalizeLicenceKey(raw: string): string {
  const body = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(new RegExp(`^${PREFIX}`), "");
  const clean = body.replace(new RegExp(`[^${ALPHABET}]`, "g"), "");
  const groups = clean.match(/.{1,4}/g) ?? [];
  return [PREFIX, ...groups].join("-");
}

// FNV-1a — pure JS on purpose so the wizard can validate before submitting.
function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function checksum(payload: string): string {
  let h = fnv1a(`${PREFIX}-v1:${payload}`);
  let out = "";
  for (let i = 0; i < GROUP; i++) {
    out += ALPHABET[h % ALPHABET.length];
    h = Math.floor(h / ALPHABET.length) + 7 * (i + 1);
  }
  return out;
}

export function isValidLicenceFormat(raw: string): boolean {
  const key = normalizeLicenceKey(raw);
  const parts = key.split("-");
  if (parts.length !== 4) return false;
  if (parts[0] !== PREFIX) return false;
  if (parts.slice(1).some((p) => p.length !== GROUP)) return false;
  return parts[3] === checksum(parts[1] + parts[2]);
}

/** Build a key from two 4-char groups. Used by scripts/make-licence-key.js. */
export function mintLicenceKey(a: string, b: string): string {
  const g = (s: string) =>
    s
      .toUpperCase()
      .replace(new RegExp(`[^${ALPHABET}]`, "g"), "")
      .padEnd(GROUP, ALPHABET[0])
      .slice(0, GROUP);
  const p1 = g(a);
  const p2 = g(b);
  return [PREFIX, p1, p2, checksum(p1 + p2)].join("-");
}

/** Show a key without printing all of it (settings page). */
export function maskLicenceKey(key: string): string {
  const parts = normalizeLicenceKey(key).split("-");
  if (parts.length !== 4) return key;
  return `${parts[0]}-${parts[1]}-••••-${parts[3]}`;
}
