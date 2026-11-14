---
title: Built-in tools
track: Basics
summary: Watch Claude read, search, edit and run commands, one tool at a time.
prompts:
  - "Read hello.txt and tell me what it says."
  - "Find every .txt file in this folder and search them for the word hello."
  - "Create tools-demo.txt with three short lines about what Claude can do."
  - "In tools-demo.txt, change the second line to something funnier."
  - "Run ls -la in this folder and summarise what you see."
  - "Optional: fetch https://example.com and tell me its title in one sentence."
checks:
  - type: promptCount
    min: 4
  - type: toolUsed
    tool: Read
    label: Claude read a file with the Read tool
  - type: toolUsed
    tool: Write
    label: Claude created a file with the Write tool
  - type: toolUsed
    tool: Edit
    label: Claude changed a file with the Edit tool
  - type: toolUsed
    tool: Bash
    label: Claude ran a command with the Bash tool
---

## Claude works through tools

Claude can't touch your files by itself. It acts by calling **tools**. Each call shows up
in the feed as one row, tagged with the tool's name.

## The tools you'll meet

- **Read**: opens a file and reads it.
- **Write**: creates a new file, or replaces one.
- **Edit**: changes part of an existing file.
- **Bash**: runs a shell command such as `ls`, `grep` or `find`.
- **Grep** and **Glob**: search file contents and find files by name. On macOS, Linux and
  WSL, Claude usually does these searches through Bash instead. On Windows you may see
  Grep and Glob rows.
- **WebFetch**: downloads a web page so Claude can read it.

## Try it

1. Open a **second terminal** and run:
   ```bash
   cd sandbox
   claude
   ```
2. Send each prompt in order. After each one, find its row in the feed. You never name a
   tool. Claude picks it.
   - Read a file:

     ```prompt
     1
     ```
   - Search files:

     ```prompt
     2
     ```
   - Create a file:

     ```prompt
     3
     ```
   - Change that file:

     ```prompt
     4
     ```
   - Run a command:

     ```prompt
     5
     ```
   - Optional, needs network access and may ask for permission:

     ```prompt
     6
     ```

Approve a permission prompt when one appears. Reading is allowed without asking, but
creating or editing a file, or running most commands, asks first. A tool you deny never
reaches the feed, because the feed is driven by hooks that fire after a tool finishes.

**Check my work** only needs the first five.

## What to notice

- One tool call is one feed row, so a single prompt can add several rows.
- The search prompt may show a Bash row, not Grep or Glob. That is normal, not a mistake.
- If a row is missing, make sure the dev server is running and you accepted the trust
  prompt, then send the prompt again.
- Claude asks permission before changing things. Lesson 4 covers how to control that.
