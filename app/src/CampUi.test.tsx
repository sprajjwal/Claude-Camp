import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { TopAppBar } from "./components/TopAppBar";
import { mockMatchMedia } from "./test/helpers";

const lessons = [
  { id: "01-a", title: "First run", track: "Basics", summary: "Summary one" },
  { id: "02-b", title: "Second step", track: "Customization", summary: "Summary two" },
];

class FakeES {
  onopen = null;
  onerror = null;
  onmessage = null;
  close() {}
}

function mockFetch(completed: string[] = []) {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const json = (d: unknown) => ({ ok: true, status: 200, statusText: "OK", json: async () => d });
    if (url === "/api/lessons") return json(lessons);
    if (url === "/api/progress" && !init?.method) return json({ completed });
    const m = /^\/api\/lessons\/([^/]+)$/.exec(url);
    if (m) return json({ ...lessons.find((l) => l.id === m[1])!, prompts: ["say hi"], body: "Body" });
    return json({});
  }));
}

describe("TopAppBar", () => {
  it("renders title and optional tagline", () => {
    const { rerender } = render(<TopAppBar title="Claude Camp" tagline="Learn it" />);
    expect(screen.getByRole("heading", { level: 1, name: "Claude Camp" })).toBeInTheDocument();
    expect(screen.getByText("Learn it")).toBeInTheDocument();
    rerender(<TopAppBar title="Claude Camp" />);
    expect(screen.queryByText("Learn it")).not.toBeInTheDocument();
  });
});

describe.each([false, true])("Claude Camp lesson UI (dark=%s)", (dark) => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("EventSource", FakeES);
    mockMatchMedia(dark);
  });

  it("shows tagline, progress, track chip, summary and prompts heading", async () => {
    mockFetch(["01-a"]);
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe(dark ? "dark" : "light");
    expect(await screen.findByText("Summary two")).toBeInTheDocument();
    expect(screen.getByText("Learn Claude Code, one small step at a time")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 lessons complete/)).toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(within(main).getByText("Customization")).toBeInTheDocument();
    expect(within(main).getByRole("heading", { name: "Your turn: try these in your terminal" })).toBeInTheDocument();
    expect(screen.getByText("say hi")).toBeInTheDocument();
  });

  it("shows 0 of N when nothing is complete and leaves no run-in-browser UI", async () => {
    mockFetch();
    render(<App />);
    expect(await screen.findByText("Summary one")).toBeInTheDocument();
    expect(screen.getByText(/0 of 2 lessons complete/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^run/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/example/i)).not.toBeInTheDocument();
  });

  it("Next advances to the next lesson and updates progress", async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Summary one");
    await user.click(screen.getByRole("button", { name: /Next lesson/ }));
    expect(await screen.findByText("Summary two")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 lessons complete/)).toBeInTheDocument();
  });
});
