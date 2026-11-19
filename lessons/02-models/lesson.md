---
title: Choosing a model
track: Basics
summary: Switch between Claude models with /model and learn when a faster or smarter one pays off.
preview: notes-model.js
prompts:
  - "In two sentences, explain what a closure is in JavaScript."
  - "/model"
  - "Write a function in notes-model.js that merges two sorted arrays, then explain its time complexity."
checks:
  - type: promptCount
    min: 2
  - type: toolUsed
    tool: Write
    label: Claude wrote a file with the Write tool
  - type: eventSeen
    event: Stop
    label: Claude finished a response
---

## One family, different trade-offs

Claude comes in several models. They trade off three things:

- **Haiku**: fastest and cheapest. Good for quick questions, small edits and simple tasks.
- **Sonnet**: balanced speed and cost. Good for everyday coding and the usual default.
- **Opus**: slower and costlier, but stronger on multi-file work and tricky bugs.
- **Fable**: the newest and most capable tier, for the hardest problems.

Bigger models reason better on hard problems, but they cost more and take longer.
A good habit: start with the default, drop down for easy work, move up when Claude
gets stuck.

## Try it

In your Claude terminal (still in `sandbox`):

1. Send this prompt and note how quickly the answer arrives:

   ```prompt
   1
   ```
2. Open the model picker. It lists the models available to you. Choose a different one
   with the arrow keys and Enter:

   ```prompt
   2
   ```
3. Send this prompt. Compare speed and depth with the first model's style:

   ```prompt
   3
   ```

You can also pick a model when starting Claude:

```bash
claude --model haiku
```

Aliases like `haiku`, `sonnet`, `opus` and `fable` point at the latest version of each
model on the Anthropic API. On Bedrock, Google Cloud or Foundry they may resolve to
older versions.

## Effort

Some models can think harder or less before answering. Claude Code calls this
**effort level**. Low effort is quicker and cheaper; high effort suits difficult
problems. The levels are `low`, `medium`, `high`, `xhigh` and `max`, and not every
model offers all of them. Start a session with `claude --effort <level>`, or use the
effort slider in the `/model` picker (left and right arrow keys).

## What to notice

- Choosing a model with `/model` keeps your earlier conversation, and it also saves
  that model as your default for new sessions. In the picker, press `s` instead of
  Enter to change the model for this session only.
- The same prompt can produce noticeably different speed and depth on each model.
- Switching down for simple tasks saves time and usage.
- The **Live view** shows `notes-model.js` as Claude writes it. Compare how each model's version looks.
