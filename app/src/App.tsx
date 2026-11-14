import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { api } from "./api";
import { Feed } from "./Feed";
import { ThemeToggle } from "./components/ThemeToggle";
import { TopAppBar } from "./components/TopAppBar";
import { useTheme } from "./theme";
import type { CheckResult, HookEvent, Lesson, LessonMeta } from "./types";
import "./App.css";

export default function App() {
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [events, setEvents] = useState<HookEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const { theme, toggle } = useTheme();

  // initial load: lesson list + saved progress; resume at first unfinished lesson
  useEffect(() => {
    Promise.all([api.lessons(), api.progress()])
      .then(([ls, p]) => {
        setLessons(ls);
        setCompleted(p.completed);
        setCurrentId(ls.find((l) => !p.completed.includes(l.id))?.id ?? ls[0]?.id ?? null);
      })
      .catch((e: Error) => setError(`Can't reach the server (${e.message}). Is \`npm run dev\` running?`));
  }, []);

  // live event stream from the hooks
  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (m) => setEvents((prev) => [...prev, JSON.parse(m.data) as HookEvent]);
    return () => es.close();
  }, []);

  // load lesson + reset feed/checks when it changes
  useEffect(() => {
    if (!currentId) return;
    startedAt.current = Date.now();
    setResults(null);
    setEvents([]);
    api.clearEvents();
    api.lesson(currentId).then(setLesson).catch((e: Error) => setError(e.message));
  }, [currentId]);

  const index = lessons.findIndex((l) => l.id === currentId);
  const next = lessons[index + 1];
  const done = currentId !== null && completed.includes(currentId);

  const runCheck = useCallback(async () => {
    if (!currentId) return;
    setResults((await api.check(currentId, startedAt.current)).results);
  }, [currentId]);

  const goNext = async () => {
    if (!currentId) return;
    const updated = done ? completed : [...completed, currentId];
    setCompleted(updated);
    await api.saveProgress(updated);
    if (next) setCurrentId(next.id);
  };

  if (error) return <div className="error" role="alert">{error}</div>;

  return (
    <div className="app">
    <TopAppBar title="Claude Camp" tagline="Learn Claude Code, one small step at a time" actions={<ThemeToggle theme={theme} onToggle={toggle} />} />
    <div className="layout">
      <nav className="sidebar" aria-label="Lessons">
        <div className="progress">
          {completed.length} of {lessons.length} lessons complete
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${lessons.length ? (completed.length / lessons.length) * 100 : 0}%` }} />
          </div>
        </div>
        {lessons.map((l, i) => (
          <button
            key={l.id}
            className={`nav-item ${l.id === currentId ? "active" : ""}`}
            aria-current={l.id === currentId ? "page" : undefined}
            onClick={() => setCurrentId(l.id)}
          >
            <span className={`check ${completed.includes(l.id) ? "done" : ""}`}>{completed.includes(l.id) ? "✓" : i + 1}</span>
            <span>
              {l.title}
              <small>{l.track}</small>
            </span>
          </button>
        ))}
      </nav>

      <main className="lesson">
        {lesson && (
          <>
            <span className="chip">{lesson.track}</span>
            <h2>{lesson.title}</h2>
            {lesson.summary && <p className="summary">{lesson.summary}</p>}
            <Markdown>{lesson.body}</Markdown>

            <h3>Your turn: try these in your terminal</h3>
            {lesson.prompts.map((p) => (
              <div className="prompt-box" key={p}>
                <code>{p}</code>
                <button className="btn text" onClick={() => navigator.clipboard.writeText(p)}>Copy</button>
              </div>
            ))}

            <div className="actions">
              <button className="btn outlined" onClick={runCheck}>Check my work</button>
              <button className="btn filled" onClick={goNext}>
                {next ? "I get it. Next lesson →" : "Finish course ✓"}
              </button>
            </div>

            {results && (
              <ul className="results">
                {results.map((r) => (
                  <li key={r.label} className={r.passed ? "pass" : "fail"}>
                    {r.passed ? "✓" : "○"} {r.label}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      <aside className="side-feed">
        <Feed events={events} connected={connected} />
      </aside>
    </div>
    </div>
  );
}
