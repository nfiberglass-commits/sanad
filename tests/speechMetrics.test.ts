import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  countFillers,
  countWords,
  computePauses,
} from "../src/lib/speechMetrics";

describe("speech metrics", () => {
  it("counts words across Arabic and English", () => {
    expect(countWords("hello world")).toBe(2);
    expect(countWords("صباح الخير يا جماعة")).toBe(4);
    expect(countWords("  ...  ")).toBe(0);
  });

  it("counts English fillers on word boundaries", () => {
    const c = countFillers("um I was like you know actually going");
    expect(c["um"]).toBe(1);
    expect(c["like"]).toBe(1);
    expect(c["you know"]).toBe(1);
    expect(c["actually"]).toBe(1);
  });

  it("counts Arabic fillers with hamza normalization", () => {
    const c = countFillers("يعني احنا يعني هنمشي اه طبعا فا كده");
    expect(c["يعني"]).toBe(2);
    expect(c["اه"]).toBe(1);
    expect(c["طبعا"]).toBe(1);
    expect(c["فا"]).toBe(1);
  });

  it("counts hamza variants once, not once per spelling", () => {
    // اه and أه normalize to the same word — 3 occurrences must total 3, not 6
    const c = countFillers("اه تمام اه ماشي اه");
    const total = Object.values(c).reduce((a, b) => a + b, 0);
    expect(total).toBe(3);
  });

  it("does not count fillers inside other words", () => {
    const c = countFillers("فانوس بسيطة"); // فا inside فانوس, بس inside بسيطة
    expect(c["فا"]).toBeUndefined();
    expect(c["بس"]).toBeUndefined();
  });

  it("detects long pauses between segments", () => {
    const p = computePauses([
      { start: 0, end: 2, text: "a" },
      { start: 5.2, end: 7, text: "b" }, // 3.2s gap
      { start: 7.5, end: 9, text: "c" }, // 0.5s gap
    ]);
    expect(p.longPauses).toBe(1);
    expect(p.longestPauseSec).toBe(3.2);
  });

  it("computes wpm from duration", () => {
    const m = computeMetrics(
      "one two three four five six seven eight nine ten",
      [{ start: 0, end: 5, text: "x" }],
      5 // 10 words in 5 seconds → 120 wpm
    );
    expect(m.wordCount).toBe(10);
    expect(m.wpm).toBe(120);
  });

  it("computes fillers per minute", () => {
    const m = computeMetrics("يعني يعني يعني", [{ start: 0, end: 60, text: "x" }], 60);
    expect(m.totalFillers).toBe(3);
    expect(m.fillersPerMinute).toBe(3);
  });
});
