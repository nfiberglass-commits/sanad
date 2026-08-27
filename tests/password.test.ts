import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, tokenFromRecord } from "@/lib/password";

describe("password storage", () => {
  it("verifies the right password and rejects the wrong one", () => {
    const rec = hashPassword("test-pass-1");
    expect(verifyPassword("test-pass-1", rec)).toBe(true);
    expect(verifyPassword("test-pass-2", rec)).toBe(false);
  });

  it("never stores the password itself", () => {
    const rec = hashPassword("test-pass-1");
    expect(JSON.stringify(rec)).not.toContain("test-pass-1");
  });

  it("salts, so the same password hashes differently each time", () => {
    expect(hashPassword("same").hash).not.toBe(hashPassword("same").hash);
  });

  it("rejects a missing or malformed record", () => {
    expect(verifyPassword("x", undefined)).toBe(false);
    // @ts-expect-error deliberately malformed
    expect(verifyPassword("x", { algo: "scrypt" })).toBe(false);
  });

  it("changes the session token when the password changes", () => {
    const a = tokenFromRecord(hashPassword("one"), "s");
    const b = tokenFromRecord(hashPassword("two"), "s");
    expect(a).not.toBe(b);
    expect(a).toHaveLength(64);
  });
});
