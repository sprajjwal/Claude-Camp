---
name: update-claude-md
description: Update CLAUDE.md so it matches the changes made in the project so far (code, lessons, design decisions, gotchas). Edits only CLAUDE.md, never commits.
disable-model-invocation: true
argument-hint: "[optional focus, e.g. 'sidebar' or 'lessons']"
---

Bring `CLAUDE.md` up to date with what has changed. Invoking this skill is the user's request to edit
`CLAUDE.md` (and only that file). Do not commit, push, run tests, or touch other files.

## 1. Gather
- Read the current `CLAUDE.md` in full.
- Run `git status --short`, `git log --oneline -15` and `git diff HEAD --stat`, then read the diffs of
  changed files that matter (`app/src/**`, `server/src/**`, `lessons/**`, `sandbox/.claude/**`,
  `.claude/**`, `README.md`, `PLAN.md`). If an argument was given, focus on that area.
- Also use what happened earlier in this conversation: decisions the user made, things they rejected,
  and bugs that turned out to have non-obvious causes.

## 2. Decide what belongs
`CLAUDE.md` must stay **very minimal**: a short list of rules and pitfalls a future session needs and
cannot get from the code. Add or change a line only for:
- **Conventions and preferences** the user stated or corrected (including things they rejected).
- **Gotchas**: non-obvious causes of bugs or environment problems, and the fix pattern.
- **Commands** that changed.
- **Project skills/agents** that exist (name and one-line purpose only).

Never write:
- **Progress or status**: what is done, to do, last test results, test counts, what is verified or not,
  lesson completion, uncommitted state, or any lesson-by-lesson list (that lives in `PLAN.md`).
- **Implementation details**: how a feature or component works, file or component names beyond the
  top-level layout, CSS values, colours, sizes, state keys, behaviour descriptions.
- A step-by-step history of changes.

## 3. Edit
- Update existing lines in place and delete lines that are stale, duplicated, or fall under "never write"
  (including ones already in the file). Prefer removing text over adding it.
- Follow common CLAUDE.md practice: short (well under 200 lines), specific and verifiable instructions
  in the imperative ("Use X", "Do not Y"), grouped under headings (overview, commands, structure,
  workflow, code style, testing, do-not, environment gotchas), and no duplicated or obvious advice.
- Keep the existing section structure and terseness. No absolute paths, no secrets, no personal data.
- If a statement can't be confirmed from the repo or this conversation, don't write it.

## 4. Report
Show a short summary: what you added, changed and removed, and anything you were unsure about and left
out. Remind the user that `/commit-push` will commit the change. Restart Claude Code to pick up a new skill.
