import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { mockMatchMedia } from "./test/helpers";

const lessons = [
  { id: "01-first-run", title: "First run", track: "Basics", summary: "s1" },
  { id: "02-second", title: "Second step", track: "Basics", summary: "s2" },
];
const lessonBody = (id: string) => ({
  ...lessons.find((l) => l.id === id)!,
  prompts: ["say hello"],
  body: `Body of ${id}`,
});

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((m: { data: string }) => void) | null = null;
  closed = false;
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  close() {
    this.closed = true;
  }
}

function mockFetch(opts: { fail?: boolean; completed?: string[] } = {}) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    if (opts.fail) throw new Error("offline");
    const json = (data: unknown) => ({ ok: true, status: 200, statusText: "OK", json: async () => data });
    if (url === "/api/lessons") return json(lessons);
    if (url === "/api/progress" && !init?.method) return json({ completed: opts.completed ?? [] });
    const m = /^\/api\/lessons\/([^/]+)$/.exec(url);
    if (m) return json(lessonBody(m[1]));
    return json({});
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("App", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
    mockMatchMedia(false);
  });

  it("renders lessons from fetch and marks the current one with aria-current", async () => {
    mockFetch();
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Lessons" });
    const first = await screen.findByRole("button", { name: /First run/ });
    expect(nav).toContainElement(first);
    expect(screen.getByRole("button", { name: /Second step/ })).toBeInTheDocument();
    expect(first).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /Second step/ })).not.toHaveAttribute("aria-current");
    expect(await screen.findByText("Body of 01-first-run")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Claude Camp" })).toBeInTheDocument();
  });

  it("resumes at the first unfinished lesson", async () => {
    mockFetch({ completed: ["01-first-run"] });
    render(<App />);
    const second = await screen.findByRole("button", { name: /Second step/ });
    expect(second).toHaveAttribute("aria-current", "page");
    expect(await screen.findByText("Body of 02-second")).toBeInTheDocument();
  });

  it("includes the theme toggle", async () => {
    mockFetch();
    render(<App />);
    expect(await screen.findByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("shows an alert when the server is unreachable", async () => {
    mockFetch({ fail: true });
    render(<App />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Can't reach the server/);
  });

  it("closes the event stream on unmount without throwing", async () => {
    mockFetch();
    const { unmount } = render(<App />);
    await screen.findByRole("button", { name: /First run/ });
    expect(() => unmount()).not.toThrow();
    expect(FakeEventSource.instances[0].closed).toBe(true);
  });
});
