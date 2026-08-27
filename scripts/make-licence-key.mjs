// Mint a Sanad licence key. Usage: node scripts/make-licence-key.mjs [count]
// The checksum only proves the key was typed correctly. Real entitlement
// checking belongs in the licence gateway.
import { mintLicenceKey } from "../src/lib/licence.ts";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const rand = (n) =>
  Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

const count = Number(process.argv[2] || 1);
for (let i = 0; i < count; i++) {
  console.log(mintLicenceKey(rand(4), rand(4)));
}
