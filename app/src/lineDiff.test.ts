import { describe, expect, it } from "vitest";
import { lineDiff, withContext } from "./lineDiff";

describe("lineDiff", () => {
  it("marks identical text as all same", () => {
    expect(lineDiff("a\nb", "a\nb").every((l) => l.type === "same")).toBe(true);
  });
  it("detects add and delete", () => {
    expect(lineDiff("a\nb\nc", "a\nx\nc")).toEqual([
      { type: "same", text: "a" },
      { type: "del", text: "b" },
      { type: "add", text: "x" },
      { type: "same", text: "c" },
    ]);
  });
  it("treats everything as added when baseline is empty", () => {
    const d = lineDiff("", "a\nb");
    expect(d.filter((l) => l.type === "add").map((l) => l.text)).toEqual(["a", "b"]);
  });
  it("handles removal of all content", () => {
    expect(lineDiff("a\nb", "").filter((l) => l.type === "del")).toHaveLength(2);
  });
});

describe("withContext", () => {
  const lines = (n: number) => Array.from({ length: n }, (_, i) => ({ type: "same" as const, text: `l${i}` }));
  it("collapses a fully unchanged file into one gap", () => {
    expect(withContext(lines(5))).toEqual([{ type: "gap", hidden: 5 }]);
  });
  it("keeps context around changes and gaps the rest", () => {
    const l = lines(10);
    l[5] = { type: "add" as never, text: "new" };
    const out = withContext(l, 2);
    expect(out[0]).toEqual({ type: "gap", hidden: 3 });
    expect(out.filter((x) => x.type !== "gap")).toHaveLength(5);
    expect(out[out.length - 1]).toEqual({ type: "gap", hidden: 2 });
  });
  it("does not add a gap when everything is near a change", () => {
    const l = lines(3);
    l[1] = { type: "del" as never, text: "x" };
    expect(withContext(l).some((x) => x.type === "gap")).toBe(false);
  });
});
