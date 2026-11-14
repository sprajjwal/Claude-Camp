# Claude Camp

Webapp that teaches Claude Code lesson by lesson: a short explanation, prompts to run in a real
terminal, live results in the browser, and a Next button. The folder and npm package are named
`learn-claude`. See `PLAN.md` (curriculum) and `README.md` (setup).

## Commands
```bash
nvm use                 # Node 22 (.nvmrc)
npm install             # npm workspaces: app + server
npm run dev             # server :4000, app :5173 (~10s to start on /mnt/c)
npm test                # server + app Vitest/RTL suites
npm run typecheck
npm run build
cd sandbox && claude -p "<prompt>"   # exercise the hooks pipeline headlessly
```

## Project structure
- `app/`: React + Vite + TypeScript frontend
- `server/`: Express 5 API
- `lessons/<NN-name>/lesson.md`: one folder per lesson; adding one needs no code changes
- `sandbox/`: the folder the user runs `claude` in, so lessons never touch the app's code

## Workflow
- Do not commit or push unless asked. Use `/commit-push`. Never force-push.
- Do not run tests, typecheck or the test-engineer after a change unless asked. Use `/run-tests`.
- Verify Claude Code details (commands, hook events, model IDs) against the official docs before
  writing a lesson, and run its prompts live before calling it done.

## Code style
- Use theme tokens for all colors, type, spacing and shape; no hard-coded values in component CSS.
- Do not change the palette or overall look unless asked. Keep Claude's Academy look, Material Design 3
  structure and a neutral (not warm) light mode.
- Keep the code portable (the user also works on a Mac): no absolute paths in hooks or server code,
  LF line endings, `curl` only for hooks.

## Testing
- Test UI with React Testing Library: query by role, label or text, never class names.
- Test server-only logic with plain Vitest.
- Cover light and dark themes where theme affects behaviour.

## Do not
- Run Claude inside the app (browser terminal and headless runner were rejected); do not re-propose them.
- Use `node-pty`; it can't build here (no gcc/make in WSL).
- Use markdown tables in lessons; the renderer has no GFM plugin. Use lists.
- Run `pkill -f "tsx watch"`; the pattern matches the calling shell. Use `[t]sx watch`.

## Environment gotchas
- `/mnt/c` needs `[automount] options="metadata"` in `/etc/wsl.conf` (then `wsl --shutdown`), or npm
  fails with `EPERM chmod`.
- Start the dev server with `setsid npm run dev > <logfile> 2>&1 &` so it outlives the tool call.
- Vite file watching doesn't fire on `/mnt/c`. Keep polling enabled in `app/vite.config.ts`. If a fix
  seems ignored, `curl localhost:5173/src/<file>` to see what Vite serves.
- Browser console errors are forwarded to the `npm run dev` log; grep it before guessing at a blank page.
- A `useEffect` callback must not return anything but a cleanup function (this blanked the whole app).
- Project hooks run only after the folder-trust prompt is accepted; headless `-p` skips it.
- On macOS, Linux and WSL, Claude searches through Bash, not the Grep/Glob tools; the feed shows Bash
  rows. Do not write lesson checks that require Grep, Glob or WebFetch.
- Versions are recent (Vite 8, TypeScript 7, Express 5); older tutorials may not match.

## Project skills and agents
Manual only: `/commit-push`, `/run-tests` (test-engineer sub-agent), `/update-claude-md`.
Agent `ux-designer` (read-only): give it a lesson type and topic before writing a lesson; it returns a
design brief. Verify its tool and command claims against the docs.
