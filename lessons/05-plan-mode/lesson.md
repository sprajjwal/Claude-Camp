---
title: Plan mode in practice
track: Basics
summary: Ask for a plan, adjust it, then approve it and watch your page change live.
preview: camping.html
prompts:
  - "Plan how to add a packing checklist section to camping.html, with a heading and at least five items. Do not edit the file yet."
  - "Revise the plan: use a plain list with a checkbox for each item, and no JavaScript."
  - "Add an HTML comment above the checklist saying it was added from a plan."
checks:
  - type: promptCount
    min: 3
  - type: toolUsed
    tool: Edit
    label: Claude edited camping.html after you approved the plan
  - type: eventSeen
    event: Stop
    label: Claude finished a response
---

## Plan first, build second

In lesson 4 you met **plan mode**, the third `Shift+Tab` stop. Here you use it for real.
Claude reads and thinks, then proposes a plan. You can fix a wrong approach before any file
changes, which is cheaper than undoing finished work.

The sandbox already has a small page, `camping.html`. Find it in the **Live view** panel
next to this lesson. It shows the page and its source, and refreshes about once a second.
Lines that Claude adds are marked `+` in the **Source** tab.

## Try it

1. Open a **second terminal** and run:
   ```bash
   cd sandbox
   claude
   ```
2. Press `Shift+Tab` until the bar says `plan mode on`.
3. Ask for a plan:

   ```prompt
   1
   ```

   Claude researches and writes a plan. The Live view does not change, and the checklist
   below stays unticked. Both are expected.
4. Steer the plan. When Claude asks whether to proceed, choose **No, keep planning**, then
   send this:

   ```prompt
   2
   ```

   Claude shows a revised plan. This is the point of plan mode: you change direction while
   it costs nothing.
5. Approve the plan. In the dialog, choose the option that lets Claude start editing:
   `Yes, auto-accept edits` or `Yes, and use auto mode`, depending on your setup. Claude
   leaves plan mode and edits `camping.html`. Watch the Live view update.
6. Send a small follow-up, now that Claude is building:

   ```prompt
   3
   ```
7. Optional: open `sandbox/camping.html` in your editor, change a line, and save. The Live
   view picks it up too.

## Handy extras

- Press `Ctrl+G` at the approval dialog to open the plan in your text editor and edit it
  yourself before Claude continues.
- Prefix a single prompt with `/plan` to plan just that request, without switching modes.
- Start in plan mode with `claude --permission-mode plan`.
- `/model opusplan` uses Opus while planning and Sonnet while building.

## What to notice

- The Live view stays unchanged until you approve. A Bash or Read row in the feed during planning is
  fine, because those only explore.
- At the approval dialog, `Shift+Tab` approves the plan. Press `Esc` first if you only want
  to leave.
- The Edit row appears after you approve, not before.
- If a row is missing, check the terminal for a waiting dialog, make sure the dev server is
  running, and confirm you accepted the trust prompt.
- Press `Shift+Tab` back to manual mode when you finish.
- To run the lesson again, restore the page with `git checkout sandbox/camping.html`.
