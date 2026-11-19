import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const lessons = [
  { id: "01-a", title: "With preview", track: "Basics", summary: "s" },
  { id: "02-b", title: "No preview", track: "Basics", summary: "s" },
];

class FakeEventSource {
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((m: { data: string }) => void) | null = null;
  close() {}
}

function stubMedia(wide: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("min-width") ? wide : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })),
  );
}

function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const json = (data: unknown) => ({ ok: true, status: 200, statusText: "OK", json: async () => data });
      if (url === "/api/lessons") return json(lessons);
      if (url === "/api/progress" && !init?.method) return json({ completed: [] });
      if (url.startsWith("/api/sandbox-file")) return json({ content: "x\ny", modified: 1 });
      const m = /^\/api\/lessons\/([^/]+)$/.exec(url);
      if (m) {
        const l = lessons.find((x) => x.id === m[1])!;
        return json({ ...l, prompts: [], body: "b", preview: m[1] === "01-a" ? "notes.md" : undefined });
      }
      return json({});
    }),
  );
}

describe("App live view layout", () => {
  beforeEach(() => {
    vi.stubGlobal("EventSource", FakeEventSource);
    stubFetch();
  });

  it("uses a side column with a width handle when wide", async () => {
    stubMedia(true);
    render(<App />);
    expect(await screen.findByRole("region", { name: "Live view of notes.md" })).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Resize live view width" })).toHaveAttribute("aria-valuenow", "384");
    await screen.findByRole("tablist");
    expect(screen.queryByRole("separator", { name: "Resize live view height" })).not.toBeInTheDocument();
  });

  it("stacks above the feed with a height handle when narrow", async () => {
    stubMedia(false);
    render(<App />);
    expect(await screen.findByRole("region", { name: "Live view of notes.md" })).toBeInTheDocument();
    expect(await screen.findByRole("separator", { name: "Resize live view height" })).toHaveAttribute("aria-valuenow", "320");
    expect(screen.queryByRole("separator", { name: "Resize live view width" })).not.toBeInTheDocument();
  });

  it("persists a dragged width to localStorage and restores it", async () => {
    stubMedia(true);
    const { unmount } = render(<App />);
    const handle = await screen.findByRole("separator", { name: "Resize live view width" });
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}"); // direction -1: left grows
    expect(localStorage.getItem("preview-width")).toBe("408");
    expect(handle).toHaveAttribute("aria-valuenow", "408");
    unmount();
    render(<App />);
    expect(await screen.findByRole("separator", { name: "Resize live view width" })).toHaveAttribute("aria-valuenow", "408");
  });

  it("persists a dragged height to localStorage", async () => {
    stubMedia(false);
    render(<App />);
    const handle = await screen.findByRole("separator", { name: "Resize live view height" });
    handle.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(localStorage.getItem("preview-height")).toBe("344");
  });

  it("shows no live view for a lesson without preview", async () => {
    stubMedia(true);
    render(<App />);
    await screen.findByRole("region", { name: "Live view of notes.md" });
    await userEvent.click(screen.getByRole("button", { name: /No preview/ }));
    await screen.findByText("b");
    expect(screen.queryByRole("region", { name: /Live view of/ })).not.toBeInTheDocument();
  });

  it("does not throw when matchMedia is missing", async () => {
    vi.stubGlobal("matchMedia", undefined);
    render(<App />);
    expect(await screen.findByRole("region", { name: "Live view of notes.md" })).toBeInTheDocument();
  });
});
