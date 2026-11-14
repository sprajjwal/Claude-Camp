import fs from "node:fs";
import express from "express";
import { addClient, addEvent, clearEvents, snapshot } from "./events.js";
import { getLesson, listLessons } from "./lessons.js";
import { runChecks } from "./checks.js";
import { PROGRESS_FILE } from "./paths.js";

const PORT = Number(process.env.PORT ?? 4000);
const app = express();
app.use(express.json({ limit: "5mb" }));

// Claude Code hooks POST their JSON payload here (see sandbox/.claude/settings.json)
app.post("/events", (req, res) => {
  const event = addEvent(req.body ?? {});
  res.json({ ok: true, id: event.id });
});

app.get("/api/stream", (_req, res) => addClient(res));
app.get("/api/events", (_req, res) => res.json(snapshot()));
app.delete("/api/events", (_req, res) => {
  clearEvents();
  res.json({ ok: true });
});

app.get("/api/lessons", (_req, res) => res.json(listLessons()));
app.get("/api/lessons/:id", (req, res) => {
  const lesson = getLesson(req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  res.json(lesson);
});

app.post("/api/lessons/:id/check", (req, res) => {
  const lesson = getLesson(req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  const since = Number(req.body?.since ?? 0);
  const results = runChecks(lesson.checks, since);
  res.json({ passed: results.every((r) => r.passed), results });
});

app.get("/api/progress", (_req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8")));
  } catch {
    res.json({ completed: [] });
  }
});
app.put("/api/progress", (req, res) => {
  const completed = Array.isArray(req.body?.completed) ? req.body.completed.map(String) : [];
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed }, null, 2));
  res.json({ completed });
});

// localhost only: the events endpoint is unauthenticated
app.listen(PORT, "127.0.0.1", () => console.log(`server listening on http://localhost:${PORT}`));
