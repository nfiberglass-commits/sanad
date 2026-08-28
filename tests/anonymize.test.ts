import { describe, it, expect } from "vitest";
import { maskContent } from "@/lib/anonymize";

describe("maskContent", () => {
  it("still masks emails and phones", () => {
    expect(maskContent("راسلني على someone@example.com")).toContain("[email]");
    expect(maskContent("كلمني على 01001234567")).toContain("[phone]");
  });

  it("masks links", () => {
    expect(maskContent("افتح https://portal.example.com/invite?x=1 دلوقتي")).toBe(
      "افتح [link] دلوقتي"
    );
    expect(maskContent("see www.example.com/page")).toBe("see [link]");
  });

  it("masks a credential-shaped token (mixed case or hard symbol)", () => {
    expect(maskContent("الدخول Niile@2026 على النظام")).toContain("[secret]");
    expect(maskContent("use Xk9mQ2pTr7")).toBe("use [secret]");
  });

  it("leaves product and order codes alone", () => {
    const s = "محتاج STP-IR-Y18 والأمر SO3437 قبل الخميس";
    expect(maskContent(s)).toBe(s);
  });

  it("masks the token after a password word, even lowercase-only", () => {
    expect(maskContent("الباسورد بتاع الأودو هو nile2026")).toContain("[secret]");
    expect(maskContent("password: hello1234")).toContain("[secret]");
    expect(maskContent("كلمة السر الجديدة sanad99")).toContain("[secret]");
  });

  it("does not fire on password talk with no credential nearby", () => {
    const s = "الباسورد اتغير خلاص متشكرين";
    expect(maskContent(s)).toBe(s);
  });

  it("leaves ordinary Arabic and English text untouched", () => {
    const s = "نراجع خطة الانتاج بكرة الساعة 10 صباحا مع الفريق";
    expect(maskContent(s)).toBe(s);
  });
});
