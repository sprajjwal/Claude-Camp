import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilePreview } from "./FilePreview";
import { api } from "../api";

let current: string | null = "a\nb\nc";
beforeEach(() => {
  current = "a\nb\nc";
  vi.spyOn(api, "sandboxFile").mockImplementation(async () => ({ content: current, modified: 1 }));
});
afterEach(() => vi.useRealTimers());

const tabNames = () => screen.getAllByRole("tab").map((t) => t.textContent);

describe("FilePreview", () => {
  it("shows Changes and Source only for non-html files", async () => {
    render(<FilePreview path="notes.md" />);
    await screen.findByRole("tablist");
    expect(tabNames()).toEqual(["Changes", "Source"]);
  });

  it("shows a Page tab for .html and renders it in a sandboxed iframe", async () => {
    current = "<h1>Hi</h1>";
    render(<FilePreview path="camping.html" />);
    await screen.findByRole("tablist");
    expect(tabNames()).toEqual(["Changes", "Page", "Source"]);
    await userEvent.click(screen.getByRole("tab", { name: "Page" }));
    const frame = screen.getByTitle("Rendered camping.html");
    expect(frame).toHaveAttribute("sandbox", "");
    expect(frame).toHaveAttribute("srcdoc", "<h1>Hi</h1>");
  });

  it("shows source", async () => {
    render(<FilePreview path="notes.md" />);
    await userEvent.click(await screen.findByRole("tab", { name: "Source" }));
    expect(screen.getByText(/a\s+b\s+c/)).toBeInTheDocument();
  });

  it("shows the empty-changes message when nothing changed", async () => {
    render(<FilePreview path="notes.md" />);
    expect(await screen.findByText(/No changes yet/)).toBeInTheDocument();
  });

  it("shows loading then a missing-file message, no tabs", async () => {
    current = null;
    render(<FilePreview path="new.md" />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(await screen.findByText(/new\.md doesn't exist yet/)).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("treats a missing file as an empty baseline so created content is all additions", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    current = null;
    render(<FilePreview path="new.md" />);
    await screen.findByText(/doesn't exist yet/);
    current = "line1\nline2";
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    const diff = await screen.findByLabelText("Changes since you opened the lesson");
    expect(diff.textContent).toContain("+ line1");
    expect(diff.textContent).toContain("+ line2");
  });

  it("polls and shows edits, then Start over resets the baseline", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<FilePreview path="notes.md" />);
    await screen.findByText(/No changes yet/);
    current = "a\nB\nc";
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
    const diff = await screen.findByLabelText("Changes since you opened the lesson");
    expect(diff.textContent).toContain("− b");
    expect(diff.textContent).toContain("+ B");
    await userEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(await screen.findByText(/No changes yet/)).toBeInTheDocument();
  });

  it("stops polling on unmount", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { unmount } = render(<FilePreview path="notes.md" />);
    await screen.findByRole("tablist");
    unmount();
    const calls = vi.mocked(api.sandboxFile).mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(vi.mocked(api.sandboxFile).mock.calls.length).toBe(calls);
  });

  it("survives a failing fetch", async () => {
    vi.mocked(api.sandboxFile).mockRejectedValue(new Error("offline"));
    render(<FilePreview path="notes.md" />);
    expect(await screen.findByText("Loading…")).toBeInTheDocument();
  });

  it("Hide and Show toggle the body", async () => {
    render(<FilePreview path="notes.md" />);
    await screen.findByRole("tablist");
    const btn = screen.getByRole("button", { name: "Hide" });
    expect(btn).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(btn);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders a height resize handle only in stacked mode", async () => {
    const onHeightChange = vi.fn();
    const { rerender } = render(<FilePreview path="notes.md" />);
    await screen.findByRole("tablist");
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    rerender(<FilePreview path="notes.md" height={320} onHeightChange={onHeightChange} />);
    const sep = screen.getByRole("separator", { name: "Resize live view height" });
    sep.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(onHeightChange).toHaveBeenCalledWith(344);
  });
});
