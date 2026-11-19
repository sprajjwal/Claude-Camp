import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { LESSONS_DIR } from "./paths.js";

export type Check =
  | { type: "fileExists"; path: string; label?: string }
  | { type: "toolUsed"; tool: string; label?: string }
  | { type: "promptCount"; min: number; label?: string }
  | { type: "eventSeen"; event: string; label?: string };

export interface LessonMeta {
  id: string;
  title: string;
  track: string;
  summary: string;
}

export interface Lesson extends LessonMeta {
  prompts: string[];
  checks: Check[];
  /** sandbox-relative file shown live beside the lesson (see GET /api/sandbox-file) */
  preview?: string;
  body: string;
}

function readLesson(id: string): Lesson | null {
  const file = path.join(LESSONS_DIR, id, "lesson.md");
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    id,
    title: String(data.title ?? id),
    track: String(data.track ?? ""),
    summary: String(data.summary ?? ""),
    prompts: Array.isArray(data.prompts) ? data.prompts.map(String) : [],
    checks: Array.isArray(data.checks) ? (data.checks as Check[]) : [],
    preview: typeof data.preview === "string" ? data.preview : undefined,
    body: content.trim(),
  };
}

export function listLessons(): LessonMeta[] {
  if (!fs.existsSync(LESSONS_DIR)) return [];
  return fs
    .readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .map(readLesson)
    .filter((l): l is Lesson => l !== null)
    .map(({ id, title, track, summary }) => ({ id, title, track, summary }));
}

export function getLesson(id: string): Lesson | null {
  // ids are folder names; reject anything that could escape LESSONS_DIR
  if (!/^[\w-]+$/.test(id)) return null;
  return readLesson(id);
}
