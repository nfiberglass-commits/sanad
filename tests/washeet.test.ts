import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  parseWaSheetCsv,
  looksLikeWaSheet,
  parseCsv,
} from "../src/lib/parsers/washeet";

const csv = readFileSync(
  path.join(__dirname, "fixtures", "wa-business-sheet.csv"),
  "utf-8"
);

describe("WhatsApp business sheet parser", () => {
  const result = parseWaSheetCsv(csv);

  it("recognizes the sheet format", () => {
    expect(result.isSheet).toBe(true);
    expect(looksLikeWaSheet(csv)).toBe(true);
    expect(looksLikeWaSheet("19/08/2026, 09:15 - Omar: hi")).toBe(false);
  });

  it("maps out → self and in → other", () => {
    const self = result.messages.filter((m) => m.author === "self");
    const other = result.messages.filter((m) => m.author === "other");
    expect(self).toHaveLength(3); // m2, m6, m7 (broadcast excluded)
    expect(other).toHaveLength(2); // the two real inbound texts
  });

  it("skips media labels and reactions", () => {
    expect(result.mediaSkipped).toBe(1);
    expect(result.reactionsSkipped).toBe(1);
  });

  it("excludes template blasts sent ≥4 times", () => {
    expect(result.broadcastSkipped).toBe(4);
    expect(result.messages.some((m) => m.content.includes("عرض خاص"))).toBe(false);
  });

  it("falls back to wa_id when name is empty", () => {
    const invoice = result.messages.find((m) => m.content.includes("invoice"));
    expect(invoice?.counterpartName).toBe("201222222222");
  });

  it("parses ISO dates", () => {
    const first = result.messages[0];
    expect(first.sentAt?.getUTCFullYear()).toBe(2026);
    expect(first.sentAt?.getUTCMonth()).toBe(7);
  });

  it("keeps multi-line quoted CSV fields together", () => {
    const multi = result.messages.find((m) => m.content.includes("اتفقنا"));
    expect(multi?.content).toContain("والمطلوب بالظبط");
  });

  it("csv parser handles quoted commas", () => {
    const rows = parseCsv('a,"b,c",d\n1,2,3');
    expect(rows[0]).toEqual(["a", "b,c", "d"]);
    expect(rows[1]).toEqual(["1", "2", "3"]);
  });
});
