import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { listLessons, getLesson } from "./lessons.js";
import { LESSONS_DIR } from "./paths.js";

const KNOWN = ["fileExists", "toolUsed", "promptCount", "eventSeen"];
const dirs = fs.readdirSync(LESSONS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

describe("lessons", () => {
  it("finds at least one lesson", () => expect(dirs.length).toBeGreaterThan(0));

  it.each(dirs)("%s has valid frontmatter and is listed", (id) => {
    const file = path.join(LESSONS_DIR, id, "lesson.md");
    expect(fs.existsSync(file)).toBe(true);
    const { data, content } = matter(fs.readFileSync(file, "utf8"));
    for (const k of ["title", "track", "summary"]) expect(typeof data[k]).toBe("string");
    expect(data.prompts.length).toBeGreaterThan(0);
    expect(Array.isArray(data.checks)).toBe(true);
    for (const c of data.checks) expect(KNOWN).toContain(c.type);
    expect(content.trim().length).toBeGreaterThan(0);
    expect(listLessons().map((l) => l.id)).toContain(id);
    expect(getLesson(id)?.title).toBe(data.title);
  });

  it("returns null for a missing lesson", () => expect(getLesson("nope-nope")).toBeNull());
});
