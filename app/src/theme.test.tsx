import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./components/ThemeToggle";
import { THEME_KEY, getInitialTheme, useTheme } from "./theme";
import { mockMatchMedia } from "./test/helpers";

function Harness() {
  const { theme, toggle } = useTheme();
  return <ThemeToggle theme={theme} onToggle={toggle} />;
}

describe("theme toggle", () => {
  it("flips accessible name and aria-pressed on click", async () => {
    mockMatchMedia(false);
    const user = userEvent.setup();
    render(<Harness />);
    const btn = screen.getByRole("button", { name: "Switch to dark mode" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    await user.click(btn);
    const back = screen.getByRole("button", { name: "Switch to light mode" });
    expect(back).toHaveAttribute("aria-pressed", "true");
    await user.click(back);
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toHaveAttribute("aria-pressed", "false");
  });

  it("sets data-theme and localStorage on click", async () => {
    mockMatchMedia(false);
    const user = userEvent.setup();
    render(<Harness />);
    expect(document.documentElement.dataset.theme).toBe("light");
    await user.click(screen.getByRole("button"));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    await user.click(screen.getByRole("button"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("saved choice wins over prefers-color-scheme", () => {
    mockMatchMedia(true);
    localStorage.setItem(THEME_KEY, "light");
    render(<Harness />);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("first visit follows system dark preference", () => {
    mockMatchMedia(true);
    render(<Harness />);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toHaveAttribute("aria-pressed", "true");
  });

  it("first visit follows system light preference", () => {
    mockMatchMedia(false);
    expect(getInitialTheme()).toBe("light");
  });

  it("ignores an invalid saved value", () => {
    mockMatchMedia(true);
    localStorage.setItem(THEME_KEY, "purple");
    expect(getInitialTheme()).toBe("dark");
  });

  it("works when localStorage throws", async () => {
    mockMatchMedia(true);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const user = userEvent.setup();
    render(<Harness />);
    expect(document.documentElement.dataset.theme).toBe("dark");
    await user.click(screen.getByRole("button"));
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
