# Claude Camp

A webapp that teaches Claude Code lesson by lesson. Each lesson shows a short explanation, gives
prompts to run in a real terminal, shows the results live in the browser, and has a Next button
once the user is satisfied. Curriculum: `PLAN.md`. Run instructions: `README.md`.

## Commands
```bash
nvm use                 # Node 22 (.nvmrc)
npm install             # npm workspaces: app + server
npm run dev             # server :4000, app :5173 (takes ~10s to come up on /mnt/c)
npm test                # server placeholder + app Vitest/RTL suite (~20s on /mnt/c)
npm run typecheck       # server tsc + app build
npm run build           # app production build
cd sandbox && claude -p "<prompt>"   # test the hooks pipeline headlessly
```

## Architecture
- `app/`: React + Vite + TypeScript. Vite proxies `/api` to :4000. `src/App.tsx` (layout, progress),
  `src/Feed.tsx` (live results), `src/api.ts`.
- `server/`: Express 5 run with tsx, binds to 127.0.0.1 only. `src/index.ts` (routes), `events.ts`
  (in-memory event buffer + SSE), `lessons.ts` (loader), `checks.ts` (check runner), `paths.ts`.
- `lessons/<NN-name>/lesson.md`: one folder per lesson.
- `sandbox/`: the folder the user runs `claude` in, so lessons never touch the app's code.

Data flow: Claude Code hooks (`sandbox/.claude/settings.json`: UserPromptSubmit, PostToolUse, Stop)
run `curl` -> `POST /events` -> buffer -> SSE `/api/stream` -> Feed. Progress lives in
`server/progress.json` (gitignored).

## Lesson format
Frontmatter: `title`, `track`, `summary`, `prompts[]`, `checks[]`; the markdown body is the explanation.
Check types: `fileExists {path}`, `toolUsed {tool}`, `promptCount {min}`, `eventSeen {event}`; all take
an optional `label`. Checks only give feedback and never gate the Next button. A new lesson is a new
folder, with no code changes.

## Conventions
- Verify Claude Code details (commands, hook event names, model IDs) against the official docs before
  writing a lesson, and run each lesson's prompts live before calling it done.
- Keep it portable: the user also works on a Mac. No absolute paths in hooks or server code, LF line
  endings (`.gitattributes`), only `curl` for hooks.
- The user keeps all projects in one `PROJECTS` folder on the Windows C: drive (under `/mnt/c/...` in WSL).
- Don't commit or push unless asked. Use `/commit-push` (see below) for that. Remote: `origin` = `git@github.com:sprajjwal/Claude-Camp.git`, branch `main`
  (first commit pushed; the remote's initial commit holds only a LICENSE). Never force-push.
- The project is named **Claude Camp** (tagline "Learn Claude Code, one small step at a time"). The folder and
  npm package are still `learn-claude`.
- Don't run tests, typecheck-as-verification or the test-engineer after a change unless the user asks
  (`/run-tests`). The user has asked for this explicitly more than once.
- The app never runs Claude itself (browser terminal and headless runner were tried and rejected). Don't
  re-propose them. `node-pty` also can't build here: WSL has no gcc/make.

## Gotchas
- `/mnt/c` needs `[automount] options="metadata"` in `/etc/wsl.conf` (already applied), or npm fails
  with `EPERM chmod`. Requires `wsl --shutdown` to take effect; check `uptime` to confirm a restart.
- Never `pkill -f "tsx watch"`: the pattern matches the calling shell and kills it. Use `[t]sx watch`.
- Hook payloads: all carry `session_id`, `permission_mode`, `transcript_path`; `Stop` includes
  `last_assistant_message`; `PostToolUse` has `tool_name`, `tool_input`. `transcript_path` was a project
  directory, not a `.jsonl` file, so check what is really on disk before building the transcript watcher.
- Project hooks only run after the folder-trust prompt is accepted; headless `-p` skips the prompt.
- Vite file watching does not fire on `/mnt/c` under WSL, so edits were silently never served (a fixed
  bug looked unfixed). `app/vite.config.ts` sets `watch.usePolling`; keep it. If a fix seems ignored,
  `curl localhost:5173/src/<file>` to see what Vite really serves.
- Dev-server console errors from the browser are forwarded to the `npm run dev` log, so grep it for
  `Unhandled error` / `console.error` instead of guessing at a blank page.
- A `useEffect` callback must not return a value other than a cleanup function: use a braced body,
  not `useEffect(() => el?.scrollIntoView())`. That mistake blanked the whole app.
- Start the dev server with `setsid npm run dev > <logfile> 2>&1 &` so it outlives the tool call; a
  `pkill` whose pattern appears in the same command line kills the calling shell (exit 144).
- Versions in use are recent (Vite 8, TypeScript 7, Express 5), so older tutorials may not match.

## Testing
- Use React Testing Library (`@testing-library/react`, `@testing-library/user-event`,
  `@testing-library/jest-dom`) for all tests of UI and app behaviour, running under Vitest + jsdom.
  Query by role/label/text like a user would; never test implementation details or class names.
- RTL only renders React, so server-only logic (`lessons.ts`, `checks.ts`, `events.ts`) still needs
  plain Vitest unit tests. Where possible, test it through the UI with `fetch` mocked.
- Every UI feature needs a test for both light and dark theme where the theme affects behaviour.

## Design system
Visual identity follows **Claude's own Academy site (academy.claude.com)**: the user rejected a purple
M3 palette and a terracotta one. The structure stays Material Design 3 (token names, roles, components),
but the values are Academy's, taken from its stylesheet: warm neutral grays (page `#fcfcfb`, cards white
or `#f6f5f2`, hairline borders `#e1e0d9`), near-black primary `#262622`, text `#191919`, clay accent
`#d97757` used sparingly (`--md-sys-color-clay`: logo mark, progress bar, active-lesson edge; it fails
AA as text on white, so never use it for text). Dark: `#191919` page, `#1f1f1f` cards, light warm text.
Serif headings (`--md-sys-typescale-serif`, system serif; Academy's Anthropic fonts are proprietary),
sans body. Small radii (cards 16px, buttons 8px, not pills), flat hairline-bordered panels, no shadows.
Don't change the palette or look again without being asked.
- **Tokens first.** All colors, type, spacing, shape and elevation live as CSS custom properties
  in `app/src/theme.css` (`--md-sys-color-primary`, `--md-sys-color-surface`,
  `--md-sys-color-on-surface`, `--md-sys-typescale-*`, `--md-sys-shape-corner-*`, etc.).
  Components use tokens only: no hard-coded hex values or px sizes in component CSS.
- **Color roles.** primary / secondary / tertiary / error, each with `on-` and `-container`
  variants, plus surface, surface-variant, outline. Values come from Academy, not a generated seed.
- **Typography.** System fonts (serif headings, sans body); M3 type scale (display, headline, title, body, label).
- **Shape and elevation.** M3 corner scale with Academy's tighter radii; flat panels with borders.
- **Components.** Buttons (filled, tonal, outlined, text), cards, navigation drawer for the lesson
  list, top app bar, chips for tracks, list items for the feed. Keep them in `app/src/components/`.
- **Accessibility.** WCAG AA contrast in both themes, visible focus rings, 48px touch targets,
  semantic HTML, respect `prefers-reduced-motion`.

## Light and dark mode
- A theme toggle (icon button in the top app bar) switches between light and dark.
- Implemented by setting `data-theme="light|dark"` on `<html>`; `theme.css` defines the token values
  under `:root` and `[data-theme="dark"]`.
- First visit follows `prefers-color-scheme`; after the user toggles, store the choice in
  `localStorage` (`theme` key) and honour it on load, set before first paint to avoid a flash.
- The toggle has an accessible name ("Switch to dark mode" / "Switch to light mode") and
  `aria-pressed`. Test it with RTL: toggling updates `data-theme` and persists to `localStorage`.

## Test engineer sub-agent
`.claude/agents/test-engineer.md` (senior test engineer). **Manual only:** do not run it, and do not
run tests, after finishing a feature unless the user asks. The user triggers it with the
`/run-tests [feature]` command (`.claude/commands/run-tests.md`), which invokes it with the Agent tool.
It writes and runs React Testing Library tests plus typecheck and build, never edits source, and returns
`RESULT: PASS|FAIL` with a FIXES NEEDED list. On FAIL, show the list and ask before applying fixes.
Restart Claude Code or run `/agents` to pick up the file.

## Commit and push skill
`.claude/skills/commit-push/SKILL.md`, user-invoked only: `/commit-push [message hint]`. Invoking it counts
as permission to commit and push. Flow: inspect the diff, gate on test coverage, commit, then push or stop.
- **Gate:** every changed file under `app/src`, `server/src`, lesson structure or sandbox hooks needs a test
  that exercises it, added or updated in the same change (or an existing one that still matches), and
  `npm test` must pass. Docs, config, lockfiles and assets are exempt.
- **Gate passed:** push (never force). **Gate failed:** commit locally, do not push, list what is uncovered,
  and ask whether to run the test-engineer; after its PASS, commit the tests, re-check, then push.
- **Commit messages:** Conventional Commits with no scope, `<type>: <subject>` (feat, fix, refactor, test, style,
  docs, perf, build, ci, chore, revert). Imperative, lowercase, no period, 72 chars max; `!` plus a
  `BREAKING CHANGE:` footer for removed behaviour; the Claude co-author trailer goes last.
- Restart Claude Code to pick up a new skill.

## Lesson list
Full detail in `PLAN.md`. Folder names are `lessons/<NN-name>/`. Lesson 1 is done (`01-first-run`).

**Track 1: Basics**
1. First run: install, start `claude`, how a session works (done)
2. Models: Haiku, Sonnet, Opus, Fable; `/model`; cost, speed and capability trade-offs; effort levels
3. Built-in tools: Read, Edit, Write, Bash, Grep/Glob, web fetch
4. Permission modes: default, acceptEdits, plan, bypass; Shift+Tab; allow/deny rules
5. Plan mode in practice: plan first, then build
6. Context: `/context`, `/compact`, `/clear`; `@file` references
7. CLAUDE.md and memory: `/init`, project vs. user memory

**Track 2: Customization**
8. Settings files: user, project, local; `/config`
9. Custom slash commands
10. Skills: SKILL.md, how they trigger, building one
11. Output styles and the status line
12. Subagents: built-in (Explore, Plan) and your own in `.claude/agents/`

**Track 3: Automation and integration**
13. Hooks in depth: event types, matchers, blocking a tool with an exit code, formatting after edits
14. MCP servers: `claude mcp add`; stdio vs. remote HTTP; using one
15. Build your own MCP server (small Node one in the sandbox)
16. Plugins: bundling commands, skills, hooks and MCP
17. Headless mode: `claude -p`, JSON output, scripting
18. Git workflows: commits, PRs, `gh`, code review

**Track 4: Claude API (optional, needs an API key)**
19. Messages API basics and choosing a model
20. Tool use (function calling) from your own code
21. Prompt caching, extended thinking, streaming
22. Agent SDK: building a tiny agent

## Status
Done: scaffold, server, hooks pipeline verified end to end (real `claude -p` run), lesson 1, Academy-style
M3 theme with light/dark toggle (`app/src/theme.css`, `theme.ts`, `components/ThemeToggle.tsx`,
`components/TopAppBar.tsx`), rename to Claude Camp, lesson sidebar progress bar, track chip and summary
on the lesson page, manual-only test-engineer + `/run-tests`, `/commit-push` skill with a test-coverage gate, Vitest + RTL (24 app tests passing across 5
files, last run PASS with typecheck and build), first commit pushed to GitHub `main`.
Not verified: the UI (including the Academy restyle) has never been viewed in a browser by Claude; the
user has not confirmed it renders well.
Gaps: no server unit tests (server `test` script is a placeholder echo); no test that validates
every `lessons/*/lesson.md`; lesson 1's prompts and results were not re-run live after the restyle.
To do: transcript watcher (model name, token usage), lessons 2-22 per `PLAN.md` starting with the
Basics track.
