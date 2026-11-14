import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { mockMatchMedia } from "./test/helpers";

const lessons = [
  { id: "01-first-run", title: "First run", track: "Basics", summary: "s1" },
  { id: "02-second", title: "Second step", track: "Basics", summary: "s2" },
  { id: "03-third", title: "Third step", track: "Basics", summary: "s3" },
];

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((m: { data: string }) => void) | null = null;
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  close() {}
}

function mockFetch(completed: string[] = []) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const json = (data: unknown) => ({ ok: true, status: 200, statusText: "OK", json: async () => data });
    if (url === "/api/lessons") return json(lessons);
    if (url === "/api/progress") return json({ completed });
    if (/\/check$/.test(url)) return json({ passed: true, results: [{ label: "Ran a prompt", passed: true }] });
    const m = /^\/api\/lessons\/([^/]+)$/.exec(url);
    if (m) return json({ ...lessons.find((l) => l.id === m[1])!, prompts: ["say hello"], body: `Body of ${m[1]}` });
    void init;
    return json({});
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const clearCalls = (fn: ReturnType<typeof mockFetch>) =>
  fn.mock.calls.filter(([u, i]) => u === "/api/events" && (i as RequestInit | undefined)?.method === "DELETE").length;

async function seedFeedAndResults(user: ReturnType<typeof userEvent.setup>) {
  act(() => {
    FakeEventSource.instances[0].onmessage?.({
      data: JSON.stringify({ id: 1, receivedAt: 1, hook_event_name: "UserPromptSubmit", prompt: "hello from terminal" }),
    });
  });
  expect(await screen.findByText("hello from terminal")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Check my work" }));
  expect(await screen.findByText(/Ran a prompt/)).toBeInTheDocument();
}

describe("App lesson switching", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
    mockMatchMedia(false);
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("clears the server buffer once on first load and resumes at the first unfinished lesson", async () => {
    const fetchFn = mockFetch(["01-first-run"]);
    render(<App />);
    expect(await screen.findByText("Body of 02-second")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Second step/ })).toHaveAttribute("aria-current", "page");
    expect(clearCalls(fetchFn)).toBe(1);
    expect(screen.getByText(/Results appear here/)).toBeInTheDocument();
  });

  it("clears feed, check results and server buffer when another lesson is picked in the sidebar", async () => {
    const fetchFn = mockFetch();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Body of 01-first-run");
    await seedFeedAndResults(user);
    const before = clearCalls(fetchFn);

    await user.click(screen.getByRole("button", { name: /Third step/ }));

    expect(await screen.findByText("Body of 03-third")).toBeInTheDocument();
    expect(screen.queryByText("hello from terminal")).not.toBeInTheDocument();
    expect(screen.queryByText(/Ran a prompt/)).not.toBeInTheDocument();
    expect(screen.getByText(/Results appear here/)).toBeInTheDocument();
    expect(clearCalls(fetchFn)).toBe(before + 1);
  });

  it("Next saves progress, moves on, and clears feed, results and server buffer", async () => {
    const fetchFn = mockFetch();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Body of 01-first-run");
    await seedFeedAndResults(user);
    const before = clearCalls(fetchFn);

    await user.click(screen.getByRole("button", { name: /Next lesson/ }));

    expect(await screen.findByText("Body of 02-second")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Second step/ })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("hello from terminal")).not.toBeInTheDocument();
    expect(screen.queryByText(/Ran a prompt/)).not.toBeInTheDocument();
    expect(clearCalls(fetchFn)).toBe(before + 1);
    expect(fetchFn.mock.calls.some(([u, i]) => u === "/api/progress" && (i as RequestInit | undefined)?.method === "PUT")).toBe(true);
  });

  it("does not clear anything when the already-open lesson is clicked", async () => {
    const fetchFn = mockFetch();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Body of 01-first-run");
    await seedFeedAndResults(user);
    const before = clearCalls(fetchFn);

    await user.click(screen.getByRole("button", { name: /First run/ }));

    expect(screen.getByText("hello from terminal")).toBeInTheDocument();
    expect(screen.getByText(/Ran a prompt/)).toBeInTheDocument();
    expect(clearCalls(fetchFn)).toBe(before);
  });

  it("passes a fresh startedAt to the check after switching lessons", async () => {
    const fetchFn = mockFetch();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Body of 01-first-run");
    await user.click(screen.getByRole("button", { name: /Second step/ }));
    await screen.findByText("Body of 02-second");
    await user.click(screen.getByRole("button", { name: "Check my work" }));
    const call = fetchFn.mock.calls.find(([u]) => u === "/api/lessons/02-second/check")!;
    const since = JSON.parse((call[1] as RequestInit).body as string).since;
    expect(since).toBeGreaterThan(0);
  });
});
