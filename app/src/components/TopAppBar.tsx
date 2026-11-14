import type { ReactNode } from "react";

export function TopAppBar({ title, tagline, actions }: { title: string; tagline?: string; actions?: ReactNode }) {
  return (
    <header className="top-app-bar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">✦</span>
        <div>
          <h1>{title}</h1>
          {tagline && <p className="tagline">{tagline}</p>}
        </div>
      </div>
      <div className="top-app-bar-actions">{actions}</div>
    </header>
  );
}
