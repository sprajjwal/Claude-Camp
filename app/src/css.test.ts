import { describe, expect, it } from "vitest";
import appCss from "./App.css?raw";
import indexCss from "./index.css?raw";

describe("design tokens", () => {
  it.each([
    ["App.css", appCss],
    ["index.css", indexCss],
  ])("%s uses theme tokens, no hex colors", (_name, raw) => {
    const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
});
