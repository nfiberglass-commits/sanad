import { describe, it, expect } from "vitest";
import {
  isValidLicenceFormat,
  mintLicenceKey,
  normalizeLicenceKey,
  maskLicenceKey,
} from "@/lib/licence";

describe("licence keys", () => {
  it("accepts a minted key", () => {
    expect(isValidLicenceFormat(mintLicenceKey("AB2C", "9XYZ"))).toBe(true);
  });

  it("rejects a key with one wrong character", () => {
    const key = mintLicenceKey("AB2C", "9XYZ");
    const broken = key.slice(0, 7) + (key[7] === "K" ? "M" : "K") + key.slice(8);
    expect(broken).not.toBe(key);
    expect(isValidLicenceFormat(broken)).toBe(false);
  });

  it("rejects junk and empty input", () => {
    expect(isValidLicenceFormat("")).toBe(false);
    expect(isValidLicenceFormat("SANAD-XXXX-XXXX-XXXX")).toBe(false);
    expect(isValidLicenceFormat("hello world")).toBe(false);
  });

  it("survives lowercase, spaces and a missing prefix", () => {
    const key = mintLicenceKey("QRST", "34MN");
    const parts = key.split("-").slice(1).join(" ").toLowerCase();
    expect(isValidLicenceFormat(parts)).toBe(true);
    expect(normalizeLicenceKey(parts)).toBe(key);
  });

  it("masks the middle group", () => {
    const key = mintLicenceKey("QRST", "34MN");
    expect(maskLicenceKey(key)).toContain("SANAD-QRST-");
    expect(maskLicenceKey(key)).not.toContain("34MN");
  });
});
