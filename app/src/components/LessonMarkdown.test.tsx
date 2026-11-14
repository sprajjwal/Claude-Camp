import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { LessonMarkdown } from "./LessonMarkdown";
import { mockMatchMedia } from "../test/helpers";

const prompts = ["first prompt", "second prompt"];
let writeText: ReturnType<typeof vi.fn>;

function stubClipboard() {
  writeText = vi.fn(async () => {});
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

describe("LessonMarkdown", () => {
  beforeEach(stubClipboard);

  it("renders plain markdown and ordinary code fences", () => {
    render(<LessonMarkdown prompts={prompts}>{"Hello **world**\n\n```bash\nls -la\n```"}</LessonMarkdown>);
    expect(screen.getByText("world")).toBeInTheDocument();
    expect(screen.getByText("ls -la")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });

  it("renders a spoiler collapsed by default and reveals it on click", async () => {
    const { container } = render(
      <LessonMarkdown prompts={prompts}>{"```spoiler\nsecret answer\n```"}</LessonMarkdown>,
    );
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    await userEvent.click(screen.getByText("Stuck? Show the answer"));
    expect(details.open).toBe(true);
    expect(screen.getByText("secret answer")).toBeInTheDocument();
  });

  it("copies the spoiler text without the trailing newline", async () => {
    render(<LessonMarkdown prompts={prompts}>{"```spoiler\nsecret answer\n```"}</LessonMarkdown>);
    await userEvent.click(screen.getByText("Stuck? Show the answer"));
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("secret answer");
  });

  it("renders the Nth prompt for a prompt fence and copies it", async () => {
    render(<LessonMarkdown prompts={prompts}>{"```prompt\n2\n```"}</LessonMarkdown>);
    expect(screen.getByText("second prompt")).toBeInTheDocument();
    expect(screen.queryByText("first prompt")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("second prompt");
  });

  it("renders several prompt fences in order", () => {
    render(<LessonMarkdown prompts={prompts}>{"```prompt\n1\n```\n\ntext\n\n```prompt\n2\n```"}</LessonMarkdown>);
    expect(screen.getAllByRole("button", { name: "Copy" })).toHaveLength(2);
    expect(screen.getByText("first prompt")).toBeInTheDocument();
    expect(screen.getByText("second prompt")).toBeInTheDocument();
  });

  it("falls back to a plain code block for an out-of-range or non-numeric prompt index", () => {
    render(<LessonMarkdown prompts={prompts}>{"```prompt\n9\n```\n\n```prompt\nabc\n```"}</LessonMarkdown>);
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("abc")).toBeInTheDocument();
  });

  it("does not throw with no prompts supplied", () => {
    render(<LessonMarkdown>{"```prompt\n1\n```"}</LessonMarkdown>);
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });
});

class FakeES {
  onopen = null;
  onerror = null;
  onmessage = null;
  close() {}
}

describe.each([false, true])("App lesson body prompts (dark=%s)", (dark) => {
  const heading = "Your turn: try these in your terminal";

  function setup(body: string) {
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const json = (d: unknown) => ({ ok: true, status: 200, statusText: "OK", json: async () => d });
      const lesson = { id: "01-a", title: "First run", track: "Basics", summary: "Sum" };
      if (url === "/api/lessons") return json([lesson]);
      if (url === "/api/progress" && !init?.method) return json({ completed: [] });
      if (url === "/api/lessons/01-a") return json({ ...lesson, prompts: ["say hi"], body });
      return json({});
    }));
  }

  beforeEach(() => {
    localStorage.clear();
    stubClipboard();
    vi.stubGlobal("EventSource", FakeES);
    mockMatchMedia(dark);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows the fallback section when the body has no prompt fence", async () => {
    setup("Just text");
    render(<App />);
    const main = await screen.findByRole("main");
    expect(await within(main).findByRole("heading", { name: heading })).toBeInTheDocument();
    expect(within(main).getByText("say hi")).toBeInTheDocument();
  });

  it("hides the fallback section and renders the prompt inline when a prompt fence exists", async () => {
    setup("Intro\n\n```prompt\n1\n```");
    render(<App />);
    const main = await screen.findByRole("main");
    expect(await within(main).findByText("say hi")).toBeInTheDocument();
    expect(within(main).queryByRole("heading", { name: heading })).not.toBeInTheDocument();
    expect(within(main).getAllByText("say hi")).toHaveLength(1);
  });

  it("still shows the fallback when only a spoiler fence is present", async () => {
    setup("```spoiler\nanswer\n```");
    render(<App />);
    const main = await screen.findByRole("main");
    expect(await within(main).findByRole("heading", { name: heading })).toBeInTheDocument();
  });
});
