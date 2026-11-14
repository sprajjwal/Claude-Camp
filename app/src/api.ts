import type { CheckResult, Lesson, LessonMeta } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  lessons: () => fetch("/api/lessons").then((r) => json<LessonMeta[]>(r)),
  lesson: (id: string) => fetch(`/api/lessons/${id}`).then((r) => json<Lesson>(r)),
  check: (id: string, since: number) =>
    fetch(`/api/lessons/${id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ since }),
    }).then((r) => json<{ passed: boolean; results: CheckResult[] }>(r)),
  progress: () => fetch("/api/progress").then((r) => json<{ completed: string[] }>(r)),
  saveProgress: (completed: string[]) =>
    fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    }).then((r) => json<{ completed: string[] }>(r)),
  clearEvents: () => fetch("/api/events", { method: "DELETE" }),
};
