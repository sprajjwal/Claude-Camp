import { useEffect, useRef } from "react";
import type { HookEvent } from "./types";

function toolSummary(input?: Record<string, unknown>): string {
  if (!input) return "";
  const v = input.command ?? input.file_path ?? input.pattern ?? input.url ?? input.description;
  return typeof v === "string" ? v : JSON.stringify(input);
}

function Row({ e }: { e: HookEvent }) {
  switch (e.hook_event_name) {
    case "UserPromptSubmit":
      return (
        <div className="row prompt">
          <span className="tag">You</span>
          <span>{e.prompt}</span>
        </div>
      );
    case "PostToolUse":
      return (
        <div className="row tool">
          <span className="tag">{e.tool_name}</span>
          <code>{toolSummary(e.tool_input).slice(0, 200)}</code>
        </div>
      );
    case "Stop":
      return (
        <div className="row reply">
          <span className="tag">Claude</span>
          <span className="reply-text">{e.last_assistant_message ?? "(finished)"}</span>
        </div>
      );
    default:
      return (
        <div className="row other">
          <span className="tag">{e.hook_event_name ?? "event"}</span>
        </div>
      );
  }
}

export function Feed({ events, connected }: { events: HookEvent[]; connected: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="feed">
      <div className="feed-head">
        <strong>Live results</strong>
        <span className={connected ? "dot on" : "dot"}>{connected ? "connected" : "server offline"}</span>
      </div>
      {events.length === 0 ? (
        <p className="empty">Run a prompt in your terminal. Results appear here.</p>
      ) : (
        events.map((e) => <Row key={e.id} e={e} />)
      )}
      <div ref={end} />
    </div>
  );
}
