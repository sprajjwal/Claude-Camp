---
title: Your first session
track: Basics
summary: Start Claude Code, send a prompt, and watch what it does.
prompts:
  - "What files are in this folder? Read hello.txt and tell me what it says."
  - "Create a file called notes.md containing three bullet points about what you just learned."
checks:
  - type: promptCount
    min: 1
  - type: toolUsed
    tool: Read
    label: Claude read a file with the Read tool
  - type: eventSeen
    event: Stop
    label: Claude finished a response
---

## What is Claude Code?

Claude Code is an AI assistant that runs in your terminal. You type a request in plain
English, and it can read your files, edit them, and run commands to get the job done.

A **session** is one conversation. Claude remembers everything said in it until you
start a new one with `/clear` or exit.

## Try it

1. Open a **second terminal** and run:
   ```bash
   cd sandbox
   claude
   ```
2. The first time, Claude asks whether you trust this folder. Say yes. This is also what
   allows the hooks in `sandbox/.claude/settings.json` to run.
3. Send this prompt:

   ```prompt
   1
   ```
4. Then send this one:

   ```prompt
   2
   ```

## What to notice

- Claude doesn't just answer. It **calls tools** (Read, Write...) and you see each one
  in the feed.
- By default it **asks permission** before changing anything. Try approving once and
  denying once.
- The feed shows events from **hooks**: small commands Claude Code runs at set moments.
  You'll build your own in a later lesson.
