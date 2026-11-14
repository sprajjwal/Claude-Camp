# Plan: "Claude Camp" — interactive lesson webapp

## Context
You want a hands-on way to learn Claude from scratch: simple things (models, permission modes) up to advanced ones (skills, tools, hooks, MCP servers). The app shows a short explanation for each lesson, asks you to run prompts in a real terminal with Claude Code, shows what happened in the browser, and has a **Next lesson** button for when you're ready. Nothing gets coded until this plan is approved.

The project folder `/mnt/c/Users/mesha/PROJECTS/learn-claude` is empty. **Node.js is not installed in WSL** (`node -v` failed), so step 0 is to install it, for example with nvm and Node 22 LTS.

## How the app works
```
┌──────────── Browser (React + Vite) ────────────┐
│ Lesson sidebar │ Explanation │ "Run this" box   │
│ (progress ✓)   │ (markdown)  │ Live results feed│
│                │             │ [Check] [Next →] │
└───────────────────────▲─────────────────────────┘
                        │ Server-Sent Events
┌───────────────────────┴─────────────────────────┐
│ Local Node server (Express)                      │
│  • serves lesson content                         │
│  • POST /events  ← Claude Code hooks push here   │
│  • watches session transcripts (~/.claude/       │
│    projects/<sandbox-slug>/*.jsonl)              │
│  • runs per-lesson "check" functions             │
└───────────────────────▲─────────────────────────┘
                        │ hooks + transcript files
┌───────────────────────┴─────────────────────────┐
│ Your terminal: `cd sandbox/ && claude`           │
└──────────────────────────────────────────────────┘
```
- **Sandbox folder** (`sandbox/`): you run `claude` here, so lessons can't touch the app's own code. A `.claude/settings.json` in the sandbox sets up hooks (`UserPromptSubmit`, `PostToolUse`, `Stop`) that `curl` each event to `localhost:4000/events`. That lets the browser show your prompt, every tool call (Read, Edit, Bash…), and Claude's final reply as they happen. The setup also teaches hooks before the hooks lesson covers them in depth.
- **Transcript fallback**: the server also reads the session JSONL files. They supply data that hooks don't send (model name, token usage, thinking blocks), and they keep results showing even before the hooks are set up.
- **Checks**: every lesson has a small `check()` function, for example "does `sandbox/CLAUDE.md` exist?", "was the Edit tool used?", "is a skill folder present?". The **Next** button always works. Checks just give you a ✓ and feedback.
- **Progress** is saved in `localStorage`, plus a `progress.json` on the server.

## Project structure (planned)
```
learn-claude/
  app/            React + Vite + TypeScript frontend
  server/         Express server: SSE, /events, transcript watcher, checks
  lessons/        one folder per lesson: lesson.md (explanation + prompts), check.ts, starter files
  sandbox/        where you run `claude`; reset per lesson from lesson starter files
  package.json    `npm run dev` starts app and server together (concurrently)
```
Lessons are written in markdown with frontmatter (`title`, `level`, `prompts[]`), so adding a lesson means adding a folder, not changing code.

## Curriculum (draft, ~20 lessons)
**Track 1: Basics**
1. Install and first run of `claude`; how a session works
2. Models: Haiku, Sonnet, Opus, Fable; `/model`; trade-offs between cost, speed, and capability; effort levels
3. Built-in tools: Read, Edit, Write, Bash, Grep/Glob, web fetch. Watch them stream into the feed
4. Permission modes: default, acceptEdits, plan, bypass; Shift+Tab; allow/deny rules
5. Plan mode in practice: plan first, then build
6. Context: `/context`, `/compact`, `/clear`; `@file` references
7. CLAUDE.md and memory: `/init`, project vs. user memory

**Track 2: Customization**
8. Settings files: user, project, local; `/config`
9. Custom slash commands
10. Skills: SKILL.md, how they trigger, building one
11. Output styles and the status line
12. Subagents: built-in ones (Explore, Plan) and writing your own in `.claude/agents/`

**Track 3: Automation and integration**
13. Hooks in depth: event types, matchers, blocking a tool with an exit code, formatting after edits
14. MCP servers: `claude mcp add`; local stdio vs. remote HTTP; using one
15. Build your own MCP server (a small Node one inside the sandbox)
16. Plugins: bundling commands, skills, hooks, and MCP together
17. Headless mode: `claude -p`, JSON output, scripting
18. Git workflows: commits, PRs, `gh`, code review

**Track 4: Claude API (optional, needs an API key)**
19. Messages API basics and choosing a model
20. Tool use (function calling) from your own code
21. Prompt caching, extended thinking, streaming
22. Agent SDK: building a tiny agent

Before writing each lesson, I'll check its details (command names, hook event names, model IDs) against the official docs at code.claude.com/docs and docs.claude.com, so the content is accurate and current.

## Build order (once approved)
1. Install Node; scaffold Vite React TS and the Express server; get `npm run dev` working
2. Lesson loader, sidebar, markdown view, Next button, progress
3. `/events` endpoint, SSE feed, sandbox hook config → test with lesson 1
4. Transcript watcher (for model and token info) and the check framework
5. Write lessons track by track, verifying each one live

## Verification
- `npm run dev` → open `localhost:5173`; lesson 1 renders
- In a second terminal: `cd sandbox && claude`, run the lesson prompt → the prompt, tool calls, and reply show up in the browser feed within about a second
- Run each lesson's check against both a passing and a failing sandbox state
- Click through every lesson with Next; reload the page and confirm progress is kept
