import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { mockMatchMedia } from "./test/helpers";

const lessons = [
  { id: "01-a", title: "First run", track: "Basics", summary: "s1" },
  { id: "02-b", title: "Second step", track: "Basics", summary: "s2" },
  { id: "03-c", title: "Third", track: "Basics", summary: "s3" },
  { id: "04-d", title: "Fourth", track: "Customization", summary: "s4" },
];

class FakeES {
  onopen = null;
  onerror = null;
  onmessage = null;
  close() {}
}

function mockFetch(completed: string[], list = lessons) {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const json = (d: unknown) => ({ ok: true, status: 200, statusText: "OK", json: async () => d });
    if (url === "/api/lessons") return json(list);
    if (url === "/api/progress" && !init?.method) return json({ completed });
    const m = /^\/api\/lessons\/([^/]+)$/.exec(url);
    if (m) return json({ ...list.find((l) => l.id === m[1])!, prompts: [], body: "Body" });
    return json({});
  }));
}

describe.each([false, true])("collapsible lesson nav (dark=%s)", (dark) => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("EventSource", FakeES);
    mockMatchMedia(dark);
  });

  it("shows the overall percent wheel with a completed/total tooltip", async () => {
    mockFetch(["01-a"]);
    render(<App />);
    expect(await screen.findByText("25%")).toBeInTheDocument();
    expect(screen.getByTitle("1 of 4 lessons complete")).toBeInTheDocument();
  });

  it("rounds the wheel percent and shows 0% with no lessons", async () => {
    mockFetch(["01-a"], lessons.slice(0, 3));
    const { unmount } = render(<App />);
    expect(await screen.findByText("33%")).toBeInTheDocument();
    unmount();
    mockFetch([], []);
    render(<App />);
    expect(await screen.findByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0 of 0 lessons complete")).toBeInTheDocument();
  });

  it("starts collapsed when localStorage says so, and the toggle stays accessible", async () => {
    localStorage.setItem("nav-collapsed", "1");
    mockFetch([]);
    render(<App />);
    const pin = await screen.findByRole("button", { name: "Pin lesson list open" });
    expect(pin).toHaveAttribute("aria-expanded", "false");
    expect(pin.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("peeks open on hover over the rail but not when hovering the toggle", async () => {
    localStorage.setItem("nav-collapsed", "1");
    mockFetch([]);
    const user = userEvent.setup();
    render(<App />);
    const pin = await screen.findByRole("button", { name: "Pin lesson list open" });
    const slot = screen.getByRole("navigation", { name: "Lessons" }).parentElement!;
    // the slot's "open" class is the only observable signal of the peek state
    expect(slot).not.toHaveClass("open");
    await user.hover(pin);
    expect(slot).not.toHaveClass("open");
    await user.hover(screen.getByRole("button", { name: /Second step/ }));
    expect(slot).toHaveClass("open");
    await user.unhover(screen.getByRole("button", { name: /Second step/ }));
    expect(slot).not.toHaveClass("open");
  });

  it("clicking the toggle while peeking closes the peek and persists the pin state", async () => {
    localStorage.setItem("nav-collapsed", "1");
    mockFetch([]);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "Pin lesson list open" });
    const slot = screen.getByRole("navigation", { name: "Lessons" }).parentElement!;
    await user.hover(screen.getByRole("button", { name: /First run/ }));
    expect(slot).toHaveClass("open");
    await user.click(screen.getByRole("button", { name: "Pin lesson list open" }));
    expect(slot).not.toHaveClass("open");
    expect(localStorage.getItem("nav-collapsed")).toBe("0");
    expect(screen.getByRole("button", { name: "Collapse lesson list" })).toHaveAttribute("aria-expanded", "true");
  });

  it("ignores pointer positions at or above the toggle's top edge (minus reach) when it has layout", async () => {
    localStorage.setItem("nav-collapsed", "1");
    mockFetch([]);
    render(<App />);
    const pin = await screen.findByRole("button", { name: "Pin lesson list open" });
    pin.getBoundingClientRect = () => ({ top: 500, height: 40, bottom: 540, left: 0, right: 40, width: 40, x: 0, y: 500, toJSON() {} }) as DOMRect;
    const slot = screen.getByRole("navigation", { name: "Lessons" }).parentElement!;
    const item = screen.getByRole("button", { name: /Second step/ });
    fireEvent.mouseMove(item, { clientY: 495 });
    expect(slot).not.toHaveClass("open");
    fireEvent.mouseMove(item, { clientY: 400 });
    expect(slot).toHaveClass("open");
  });

  it("theme toggle still toggles data-theme and localStorage", async () => {
    mockFetch([]);
    const user = userEvent.setup();
    render(<App />);
    const sw = await screen.findByRole("button", { name: dark ? "Switch to light mode" : "Switch to dark mode" });
    expect(sw).toHaveAttribute("aria-pressed", String(dark));
    await user.click(sw);
    expect(document.documentElement.dataset.theme).toBe(dark ? "light" : "dark");
    expect(localStorage.getItem("theme")).toBe(dark ? "light" : "dark");
    expect(screen.getByRole("button", { name: dark ? "Switch to dark mode" : "Switch to light mode" })).toHaveAttribute("aria-pressed", String(!dark));
  });
});
