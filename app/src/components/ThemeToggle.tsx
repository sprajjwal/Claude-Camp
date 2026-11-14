import type { Theme } from "../theme";

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-switch"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      onClick={onToggle}
    >
      <span className="theme-switch-icon sun" aria-hidden="true">☀</span>
      <span className="theme-switch-icon moon" aria-hidden="true">☾</span>
      <span className="theme-switch-thumb" aria-hidden="true" />
    </button>
  );
}
