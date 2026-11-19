# Claude Camp

An interactive webapp that teaches Claude Code lesson by lesson. Each lesson explains one
feature, gives you prompts to run in a real terminal, and shows the results live in the browser.

## Run it

```bash
nvm use            # Node 22 (see .nvmrc)
npm install        # installs app + server (npm workspaces)
npm run dev        # server on :4000, app on http://localhost:5173
```

Then, in a second terminal:

```bash
cd sandbox && claude
```

Claude Code hooks in `sandbox/.claude/settings.json` post each prompt, tool call and reply
to the local server, which streams them to the browser. Needs `curl`.

## Layout

- `app/` React + Vite frontend
- `server/` Express server: lessons, hook events, checks, progress
- `lessons/<NN-name>/lesson.md` one lesson each (frontmatter: title, track, prompts, checks)
- `sandbox/` the folder you run `claude` in

See `PLAN.md` for the curriculum.
