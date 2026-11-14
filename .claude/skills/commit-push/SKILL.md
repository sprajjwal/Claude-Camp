---
name: commit-push
description: Commit the current changes, and push them only if every changed source file is covered by passing tests. Otherwise commit only and ask whether to run the test-engineer.
disable-model-invocation: true
argument-hint: "[optional commit message hint]"
---

Commit the working-tree changes and push them only when test coverage is proven. Invoking this skill
is the user's explicit request to commit and, if the gate below passes, to push. Never force-push.

## 1. Inspect
Run `git status --short`, `git diff HEAD --stat` and `git branch --show-current`. If there is nothing
to commit, say so and stop. Read the diff so the commit message describes what actually changed.
Skip anything that looks like a secret (`.env*`, keys, tokens, `progress.json`, `settings.local.json`)
and tell the user if such a file shows up; ignored files stay ignored.

## 2. Coverage gate
Classify every changed file:
- **Exempt (no test needed):** docs and config only (`*.md`, `.gitignore`, `.gitattributes`, `.nvmrc`,
  lockfiles, `package.json`, tsconfig, `.claude/` files that are not code, asset files such as the favicon).
- **Needs coverage:** `app/src/**` (non-test), `server/src/**`, `lessons/*/lesson.md` structure changes,
  and hook changes in `sandbox/.claude/settings.json`.

A file that needs coverage is **covered** only if a test file that exercises it (imports it, renders it,
or reads it, e.g. `Feed.tsx` -> `Feed.test.tsx`) is part of this same change set (added or modified), or
already exists and its assertions still match the new behaviour. When unsure, count it as uncovered.
Then run `npm test` (use `nvm use` first). Failing tests mean the gate fails.
Do not run the build or typecheck as a substitute for tests.

## 3. Commit message (Conventional Commits)
Format: `<type>(<scope>): <subject>`, blank line, optional body, optional footers, then the attribution
trailer from the session's system instructions if one is present. Use `$ARGUMENTS` as a hint if given.

**Pick the type from the diff** (if the change mixes types, prefer the most user-visible one, or split
into separate commits with `git add -p`/by file when they are clearly independent):

| Type | Use for |
|---|---|
| `feat` | new capability: a lesson, route, component, check type, command or skill |
| `fix` | a bug fix in app behaviour |
| `refactor` | restructure with no behaviour change (includes deleting dead code or removing a feature that was only half-built; use `feat!` if users lose something they relied on) |
| `test` | adding or fixing tests only, including repairing flaky or wrong tests |
| `style` | visual changes: CSS, theme tokens, layout, copy tweaks (this project's UI restyles) |
| `docs` | `*.md` files, `CLAUDE.md`, `PLAN.md`, README, lesson wording only |
| `perf` | measurable speed or size improvement |
| `build` | `package.json`, lockfile, Vite/tsconfig, dependency add/remove/upgrade |
| `ci` | CI or git-hook automation |
| `chore` | minor housekeeping: `.gitignore`, formatting, renames, small cleanups, config tweaks |
| `revert` | undoing an earlier commit; subject `revert: <original subject>`, body names the hash |

**Scope** (optional, lowercase, one word): `app`, `server`, `lessons`, `theme`, `hooks`, `sandbox`,
`agents`, `skills`, or a lesson id like `lesson-01`. Omit it when the change spans many areas.

**Subject rules:** imperative mood ("add", not "added"), lowercase after the colon, no trailing period,
72 characters or fewer, says *what* changed.

**Body (when the why isn't obvious):** wrap at 72 columns; explain *why* and any trade-off, not a list
of files. Skip it for small changes.

**Footers:** `BREAKING CHANGE: <what breaks and how to migrate>` (and `!` after the type/scope) for
anything that removes or changes behaviour users depend on, such as a lesson frontmatter field or an
API route. `Refs: #123` / `Closes: #123` when an issue exists.

**Examples**
- `feat(lessons): add lesson 02 on choosing a model`
- `fix(app): keep the Next button enabled after a failed check`
- `style(theme): switch palette to Academy-inspired tokens`
- `refactor(app): remove unused example-result component`
- `test(app): cover sidebar progress in light and dark themes`
- `docs: record the no-in-browser-runner decision in CLAUDE.md`
- `chore: ignore sandbox local settings`
- `build(app): add xterm dependency`
- `feat(server)!: drop the examples frontmatter field`

Stage the intended files by name (not blindly everything) and commit. Show the user the final message
in the report.

## 4. Push or stop
- **Gate passed** (all needed files covered and `npm test` green): `git push` (add `-u origin <branch>`
  if there is no upstream). Report the commit hash and the pushed branch.
- **Gate failed** (uncovered files, or tests failing): do NOT push. The commit is already made locally.
  List the uncovered files (or the failing tests) and ask the user: "Should I run the test-engineer
  to add tests for these?" Wait for the answer.
  - If yes: invoke the `test-engineer` agent with the Agent tool, telling it the uncovered files.
    On `RESULT: PASS`, commit the new tests, re-run the gate, and push if it now passes.
    On `RESULT: FAIL`, show the FIXES NEEDED list and ask before changing any source.
  - If no: stop. Leave the local commit unpushed and say so.

## Report
End with one short summary: what was committed (hash), whether it was pushed, and, if not, exactly why.
