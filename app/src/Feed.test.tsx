import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Feed } from "./Feed";
import type { HookEvent } from "./types";

const ev = (id: number, rest: Partial<HookEvent>): HookEvent => ({ id, receivedAt: 0, ...rest });

describe("Feed", () => {
  it("renders the empty state and connection status", () => {
    const { rerender } = render(<Feed events={[]} connected={false} />);
    expect(screen.getByText(/Run a prompt in your terminal/)).toBeInTheDocument();
    expect(screen.getByText("server offline")).toBeInTheDocument();
    rerender(<Feed events={[]} connected />);
    expect(screen.getByText("connected")).toBeInTheDocument();
  });

  it("renders each event row type", () => {
    const events = [
      ev(1, { hook_event_name: "UserPromptSubmit", prompt: "make a file" }),
      ev(2, { hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: { command: "ls -la" } }),
      ev(3, { hook_event_name: "PostToolUse", tool_name: "Read", tool_input: { file_path: "/a/b.txt" } }),
      ev(4, { hook_event_name: "Stop", last_assistant_message: "All done" }),
      ev(5, { hook_event_name: "Stop" }),
      ev(6, { hook_event_name: "SessionStart" }),
    ];
    render(<Feed events={events} connected />);
    expect(screen.queryByText(/Run a prompt/)).not.toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("make a file")).toBeInTheDocument();
    expect(screen.getByText("Bash")).toBeInTheDocument();
    expect(screen.getByText("ls -la")).toBeInTheDocument();
    expect(screen.getByText("/a/b.txt")).toBeInTheDocument();
    expect(screen.getAllByText("Claude")).toHaveLength(2);
    expect(screen.getByText("All done")).toBeInTheDocument();
    expect(screen.getByText("(finished)")).toBeInTheDocument();
    expect(screen.getByText("SessionStart")).toBeInTheDocument();
  });

  it("does not throw on update or unmount (destroy-is-not-a-function regression)", () => {
    const { rerender, unmount } = render(<Feed events={[]} connected />);
    rerender(<Feed events={[ev(1, { hook_event_name: "Stop" })]} connected />);
    expect(() => unmount()).not.toThrow();
  });
});
