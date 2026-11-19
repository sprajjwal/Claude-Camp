import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { ResizeHandle } from "./ResizeHandle";
import { lineDiff, withContext } from "../lineDiff";

const POLL_MS = 1000; // polling, because file watching doesn't fire on /mnt/c

type Tab = "changes" | "page" | "source";
const TABS: { id: Tab; label: string }[] = [
  { id: "changes", label: "Changes" },
  { id: "page", label: "Page" },
  { id: "source", label: "Source" },
];
const isHtml = (path: string) => /\.html?$/i.test(path);

/** Live view (mount it with key={path} so each file starts with a fresh baseline) of one sandbox file: what changed since the lesson opened, the rendered page, or the source. */
export function FilePreview({
  path,
  height,
  onHeightChange,
}: {
  path: string;
  /** stacked layout only: the body's height in px and how to change it. Omit when the parent column sizes it. */
  height?: number;
  onHeightChange?: (height: number) => void;
}) {
  const [content, setContent] = useState<string | null | undefined>(undefined); // undefined = loading
  const [baseline, setBaseline] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("changes");
  const tabs = isHtml(path) ? TABS : TABS.filter((t) => t.id !== "page"); // only HTML can be rendered
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let stopped = false;
    const load = () =>
      api
        .sandboxFile(path)
        .then((f) => {
          if (stopped) return;
          setContent(f.content);
          // a file that doesn't exist yet starts from empty, so creating it shows every line as added
          setBaseline((prev) => prev ?? f.content ?? "");
        })
        .catch(() => undefined);
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [path]);

  const diff = useMemo(
    () => (content != null && baseline != null ? withContext(lineDiff(baseline, content)) : []),
    [content, baseline],
  );
  const changed = diff.some((l) => l.type === "add" || l.type === "del");

  return (
    <section className="preview" aria-label={`Live view of ${path}`}>
      <div className="preview-head">
        <strong>Live view</strong>
        <code>{path}</code>
        <button className="btn text" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open &&
        (content == null ? (
          <p className="empty">{content === undefined ? "Loading…" : `${path} doesn't exist yet. It appears here as soon as it is created.`}</p>
        ) : (
          <>
            <div className="preview-tabs" role="tablist" aria-label="View mode">
              {tabs.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
              {baseline !== content && (
                <button className="preview-reset" onClick={() => setBaseline(content)}>
                  Start over
                </button>
              )}
            </div>
            <div className="preview-body" style={height ? { height } : undefined}>
              {tab === "page" && <iframe className="preview-frame" title={`Rendered ${path}`} sandbox="" srcDoc={content} />}
              {tab === "source" && (
                <pre className="preview-source" tabIndex={0}>
                  {content}
                </pre>
              )}
              {tab === "changes" &&
                (changed ? (
                  <pre className="preview-source" tabIndex={0} aria-label="Changes since you opened the lesson">
                    {diff.map((l, i) =>
                      l.type === "gap" ? (
                        <span key={i} className="gap">{`⋯ ${l.hidden} unchanged line${l.hidden === 1 ? "" : "s"}`}</span>
                      ) : (
                        <span key={i} className={l.type}>
                          {(l.type === "add" ? "+ " : l.type === "del" ? "− " : "  ") + (l.text || " ")}
                        </span>
                      ),
                    )}
                  </pre>
                ) : (
                  <p className="empty">No changes yet. Edits to this file appear here as they happen.</p>
                ))}
            </div>
            {height !== undefined && onHeightChange && (
              <ResizeHandle orientation="horizontal" direction={1} label="Resize live view height" value={height} min={160} max={900} onChange={onHeightChange} />
            )}
          </>
        ))}
    </section>
  );
}
