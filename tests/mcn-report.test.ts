import { describe, it, expect } from "vitest";
import { mcnCsv, ratio } from "@/lib/mcn-report";
describe("MCN report exports", () => {
  it("neutralizes spreadsheet formula injection including leading whitespace", () => {
    const csv = mcnCsv(
      ["Network", "Note"],
      [
        ["=CMD()", " +SUM(1)"],
        ["@SUM(1)", "-1+1"],
        ['Text, quoted "name"', "new\nline"],
      ],
    );
    expect(csv).toContain('"\'=CMD()"');
    expect(csv).toContain('"\' +SUM(1)"');
    expect(csv).toContain('"\'@SUM(1)"');
    expect(csv).toContain('"\'-1+1"');
    expect(csv).toContain('"Text, quoted ""name"""');
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });
  it("does not invent conversion with no cohort", () => {
    expect(ratio(0, 0)).toBe("—");
    expect(ratio(1, 4)).toBe("25.0%");
  });
});
