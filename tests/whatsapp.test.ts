import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  parseWhatsAppTxt,
  detectLang,
  isSelf,
  normalizeName,
} from "../src/lib/parsers/whatsapp";

const fixture = (name: string) =>
  readFileSync(path.join(__dirname, "fixtures", name), "utf-8");

describe("WhatsApp parser — Android EN", () => {
  const result = parseWhatsAppTxt(fixture("whatsapp-android-en.txt"));

  it("detects android format", () => {
    expect(result.format).toBe("android");
  });

  it("skips the encryption system line", () => {
    expect(result.systemLines).toBe(1);
  });

  it("skips media and deleted messages", () => {
    expect(result.mediaOmitted).toBe(2); // <Media omitted> + This message was deleted
  });

  it("parses the right message count", () => {
    expect(result.messages).toHaveLength(5);
  });

  it("keeps multi-line messages together", () => {
    const multi = result.messages.find((m) => m.content.includes("loading photos"));
    expect(multi?.content).toContain("delivery note number");
  });

  it("parses 24h and 12h pm times", () => {
    const morning = result.messages[0];
    expect(morning.sentAt?.getHours()).toBe(9);
    const afternoon = result.messages.find((m) => m.content.includes("invoice"));
    expect(afternoon?.sentAt?.getHours()).toBe(14);
    expect(afternoon?.sentAt?.getDate()).toBe(20);
  });

  it("has no failures", () => {
    expect(result.failures).toHaveLength(0);
  });
});

describe("WhatsApp parser — iOS EN", () => {
  const result = parseWhatsAppTxt(fixture("whatsapp-ios-en.txt"));

  it("detects ios format", () => {
    expect(result.format).toBe("ios");
  });

  it("parses messages with seconds in timestamp", () => {
    expect(result.messages).toHaveLength(4); // 5 lines − 1 media
    expect(result.messages[0].sentAt?.getSeconds()).toBe(15);
  });

  it("keeps multi-line iOS messages together", () => {
    const multi = result.messages.find((m) => m.content.includes("margin"));
    expect(multi?.content).toContain("call me first");
  });
});

describe("WhatsApp parser — Android AR (Arabic-Indic digits + م marker)", () => {
  const result = parseWhatsAppTxt(fixture("whatsapp-android-ar.txt"));

  it("parses all Arabic messages", () => {
    expect(result.messages).toHaveLength(4);
  });

  it("normalizes Arabic-Indic digits in dates", () => {
    expect(result.messages[0].sentAt?.getDate()).toBe(19);
    expect(result.messages[0].sentAt?.getMonth()).toBe(7); // August
  });

  it("applies م (PM) to the hour", () => {
    expect(result.messages[0].sentAt?.getHours()).toBe(21);
  });

  it("keeps Arabic multi-line messages together", () => {
    const multi = result.messages.find((m) => m.content.includes("مدير الجودة"));
    expect(multi?.content).toContain("قوليلي النتيجة");
  });

  it("preserves Arabic content exactly", () => {
    expect(result.messages[0].content).toContain("عايزك تبعتي تقرير الانتاج");
  });
});

describe("WhatsApp parser — iOS AR", () => {
  const result = parseWhatsAppTxt(fixture("whatsapp-ios-ar.txt"));

  it("parses all messages", () => {
    expect(result.messages).toHaveLength(4);
  });

  it("reads the sender with hamza", () => {
    expect(result.messages[0].sender).toBe("عمر فاروق");
  });

  it("keeps the multi-line Arabic message", () => {
    const multi = result.messages.find((m) => m.content.includes("بديل خلال اسبوع"));
    expect(multi?.content).toContain("مش هنستني");
  });
});

describe("language detection", () => {
  it("detects Arabic", () => {
    expect(detectLang("صباح الخير يا جماعة")).toBe("ar");
  });
  it("detects English", () => {
    expect(detectLang("Send me the report today")).toBe("en");
  });
  it("detects mixed", () => {
    expect(detectLang("ابعتلي الreport النهاردة قبل الاجتماع")).toBe("mixed");
  });
});

describe("self-alias matching", () => {
  const aliases = ["Omar", "Omar Farouk", "اسامة", "عمر فاروق"];

  it("matches exact English alias", () => {
    expect(isSelf("Omar", aliases)).toBe(true);
  });
  it("matches case-insensitively", () => {
    expect(isSelf("omar farouk", aliases)).toBe(true);
  });
  it("matches Arabic with/without hamza", () => {
    expect(isSelf("أسامة", aliases)).toBe(true);
    expect(isSelf("عمر فاروق", aliases)).toBe(true);
  });
  it("does not match other people", () => {
    expect(isSelf("Kareem Nabil", aliases)).toBe(false);
    expect(isSelf("نور", aliases)).toBe(false);
  });
  it("normalizes hamza forms identically", () => {
    expect(normalizeName("أسامة")).toBe(normalizeName("اسامة"));
  });
});
