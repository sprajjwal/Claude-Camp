import type React from "react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { api } from "./api";
import { Feed } from "./Feed";
import { FilePreview } from "./components/FilePreview";
import { ResizeHandle } from "./components/ResizeHandle";
import { LessonMarkdown } from "./components/LessonMarkdown";
import { ThemeToggle } from "./components/ThemeToggle";
import { TopAppBar } from "./components/TopAppBar";
import { useTheme } from "./theme";
import type { CheckResult, HookEvent, Lesson, LessonMeta } from "./types";
import "./App.css";

const NAV_KEY = "nav-collapsed";
// the Live view gets its own column only when there is room for four (see .layout[data-preview] in App.css)
const WIDE_WITH_RAIL = "(min-width: 1650px)";
const WIDE_WITH_COLLAPSED_RAIL = "(min-width: 1400px)";

function useMedia(query: string): boolean {
  const mq = typeof window.matchMedia === "function" ? window.matchMedia(query) : null;
  return useSyncExternalStore(
    (cb) => {
      mq?.addEventListener("change", cb);
      return () => mq?.removeEventListener("change", cb);
    },
    () => mq?.matches ?? false,
  );
}

// a number kept in localStorage, for sizes the user drags
function useStoredNumber(key: string, fallback: number): [number, (n: number) => void] {
  const [value, setValue] = useState(() => Number(localStorage.getItem(key)) || fallback);
  return [
    value,
    (n) => {
      setValue(n);
      localStorage.setItem(key, String(n));
    },
  ];
}

const TOGGLE_REACH = 10; // px above the toggle button that also never open the rail

export default function App() {
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [events, setEvents] = useState<HookEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navCollapsed, setNavCollapsed] = useState(() => localStorage.getItem(NAV_KEY) === "1");
  const [peek, setPeek] = useState(false); // pointer over the rail, but not over its toggle button
  const [kbFocus, setKbFocus] = useState(false); // keyboard focus inside the rail
  const startedAt = useRef(0); // set in selectLesson
  const { theme, toggle } = useTheme();
  const [previewWidth, setPreviewWidth] = useStoredNumber("preview-width", 384);
  const [previewHeight, setPreviewHeight] = useStoredNumber("preview-height", 320);
  const roomForPreviewColumn = useMedia(navCollapsed ? WIDE_WITH_COLLAPSED_RAIL : WIDE_WITH_RAIL);

  // switch lesson and reset the feed and checks (done here, not in an effect, to avoid a cascading render)
  const selectLesson = (id: string | null) => {
    if (id === currentId) return;
    startedAt.current = Date.now();
    setResults(null);
    setEvents([]);
    api.clearEvents();
    setCurrentId(id);
  };

  // initial load: lesson list + saved progress; resume at first unfinished lesson
  useEffect(() => {
    Promise.all([api.lessons(), api.progress()])
      .then(([ls, p]) => {
        setLessons(ls);
        setCompleted(p.completed);
        // first load: state is already empty, so only start the clock and clear the server buffer
        startedAt.current = Date.now();
        api.clearEvents();
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

  // load the lesson body when the selection changes
  useEffect(() => {
    if (!currentId) return;
    api.lesson(currentId).then(setLesson).catch((e: Error) => setError(e.message));
  }, [currentId]);

  // group lessons by track, in order of first appearance
  const tracks = lessons.reduce<{ name: string; lessons: LessonMeta[] }[]>((acc, l) => {
    const name = l.track || "Other";
    const group = acc.find((t) => t.name === name);
    if (group) group.lessons.push(l);
    else acc.push({ name, lessons: [l] });
    return acc;
  }, []);

  // collapsed-rail wheel: overall progress across all lessons
  const pct = lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0;

  // Hovering anywhere on the rail opens it, except the toggle button and a strip above it.
  // Judged by pointer position (not event target) so the rail's border and padding can't open it.
  const hoverRail = (e: React.MouseEvent) => {
    const toggle = e.currentTarget.querySelector(".nav-toggle");
    if (!toggle || (e.target as Element).closest(".nav-toggle")) return;
    const r = toggle.getBoundingClientRect();
    if (r.height > 0 && e.clientY >= r.top - TOGGLE_REACH) return;
    setPeek(true);
  };

  const toggleNav = () => {
    setPeek(false);
    const nextState = !navCollapsed;
    setNavCollapsed(nextState);
    localStorage.setItem(NAV_KEY, nextState ? "1" : "0");
  };

  const previewColumn = !!lesson?.preview && roomForPreviewColumn;
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
    if (next) selectLesson(next.id);
  };

  if (error) return <div className="error" role="alert">{error}</div>;

  return (
    <div className="app">
    <TopAppBar title="Claude Camp" tagline="Learn Claude Code, one small step at a time" actions={<ThemeToggle theme={theme} onToggle={toggle} />} />
    <div className="layout" data-nav={navCollapsed ? "collapsed" : "expanded"} data-preview={previewColumn ? "column" : undefined}
         style={previewColumn ? ({ "--preview-w": `${previewWidth}px` } as CSSProperties) : undefined}>
      <div className={`sidebar-slot ${navCollapsed ? "collapsed" : ""} ${peek || kbFocus ? "open" : ""}`}>
      <nav
        className="sidebar"
        aria-label="Lessons"
        onMouseOver={hoverRail}
        onMouseMove={hoverRail}
        onMouseLeave={() => setPeek(false)}
        onFocus={(e) => {
          const t = e.target as HTMLElement;
          let visible = false;
          try { visible = t.matches(":focus-visible"); } catch { /* old engines: stay collapsed */ }
          setKbFocus(visible && !t.closest(".nav-toggle"));
        }}
        onBlur={() => setKbFocus(false)}
      >
        <div className="progress">
          <span className="progress-text">{completed.length} of {lessons.length} lessons complete</span>
          <span className="progress-wheel" title={`${completed.length} of ${lessons.length} lessons complete`}>
            <span className="wheel" style={{ "--pct": pct } as CSSProperties}><span>{pct}%</span></span>
          </span>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${lessons.length ? (completed.length / lessons.length) * 100 : 0}%` }} />
          </div>
        </div>
        {tracks.map((t, ti) => (
          <section key={t.name} aria-labelledby={`track-${ti}`} className="nav-group">
            <h2 id={`track-${ti}`} className="nav-group-title">
              {t.name}
              <span>{t.lessons.filter((l) => completed.includes(l.id)).length}/{t.lessons.length}</span>
            </h2>
            {t.lessons.map((l) => (
              <button
                key={l.id}
                className={`nav-item ${l.id === currentId ? "active" : ""}`}
                aria-current={l.id === currentId ? "page" : undefined}
                title={l.title}
                onClick={() => selectLesson(l.id)}
              >
                <span className={`check ${completed.includes(l.id) ? "done" : ""}`}>{completed.includes(l.id) ? "✓" : lessons.indexOf(l) + 1}</span>
                <span className="nav-label">{l.title}</span>
              </button>
            ))}
          </section>
        ))}
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={!navCollapsed}
          aria-label={navCollapsed ? "Pin lesson list open" : "Collapse lesson list"}
          onClick={toggleNav}
        >
          <svg className="nav-toggle-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="3.5" />
            <path d="M9 4v16" />
            <path className="nav-toggle-chevron" d="M16 9.5 13.5 12l2.5 2.5" />
          </svg>
        </button>
      </nav>
      </div>

      <main className="lesson">
        {lesson && (
          <>
            <span className="chip">{lesson.track}</span>
            <h2>{lesson.title}</h2>
            {lesson.summary && <p className="summary">{lesson.summary}</p>}
            <LessonMarkdown prompts={lesson.prompts}>{lesson.body}</LessonMarkdown>

            {!/^\s*```prompt\b/m.test(lesson.body) && (
              <>
                <h3>Your turn: try these in your terminal</h3>
                {lesson.prompts.map((p) => (
                  <div className="prompt-box" key={p}>
                    <code>{p}</code>
                    <button className="btn text" onClick={() => navigator.clipboard.writeText(p)}>Copy</button>
                  </div>
                ))}
              </>
            )}

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

      {previewColumn && lesson?.preview && (
        <aside className="side-preview">
          <ResizeHandle orientation="vertical" direction={-1} label="Resize live view width" value={previewWidth} min={288} max={900} onChange={setPreviewWidth} />
          <FilePreview key={lesson.preview} path={lesson.preview} />
        </aside>
      )}

      <aside className="side-feed">
        {!previewColumn && lesson?.preview && <FilePreview key={lesson.preview} path={lesson.preview} height={previewHeight} onHeightChange={setPreviewHeight} />}
        <Feed events={events} connected={connected} />
      </aside>
    </div>
    </div>
  );
}
