---
title: Permission modes
track: Basics
summary: Control when Claude asks first, using Shift+Tab modes and allow/deny rules.
prompts:
  - "Create modes-demo.txt with three short lines about camping."
  - "Create secret.txt containing the word pineapple."
  - "Run touch rules-demo.txt, then read secret.txt and tell me what it says."
checks:
  - type: promptCount
    min: 3
  - type: fileExists
    path: modes-demo.txt
    label: modes-demo.txt exists in the sandbox
  - type: fileExists
    path: .claude/settings.local.json
    label: You created a local settings file with rules
  - type: fileExists
    path: rules-demo.txt
    label: rules-demo.txt was created by the allowed command
  - type: eventSeen
    event: Stop
    label: Claude finished a response
---

## Who decides before Claude acts

Claude asks before it does anything risky. A **permission mode** sets how much it asks.
You can switch modes at any time with `Shift+Tab`.

## The modes

- **default** (shown as manual mode): asks before editing files and before most commands.
- **acceptEdits**: edits files without asking. It still asks before most commands.
- **plan**: Claude reads and proposes a plan, but changes nothing.
- **bypassPermissions**: never asks. Risky, so only use it in a throwaway sandbox or
  container. You won't use it here.

## Try it

1. Open a **second terminal** and run:
   ```bash
   cd sandbox
   claude
   ```
2. Check the bar at the bottom of the terminal. It should say `manual mode on`. Send this
   prompt and approve the permission dialog:

   ```prompt
   1
   ```
3. Press `Shift+Tab` once. The bar now says `accept edits on`. In this mode Claude edits
   files without asking.
4. Press `Shift+Tab` again. The bar now says `plan mode on`. In this mode Claude proposes
   changes but does not make them.
5. Press `Shift+Tab` once more to return to manual mode.

## Allow and deny rules

Modes are the broad setting. **Rules** are the precise one. You list them under
`permissions` in a settings file. They are checked in the order deny, then ask, then
allow, so a deny rule wins when both match:

```json
{
  "permissions": {
    "allow": ["Bash(npm run test)", "Bash(npm run *)"],
    "deny": ["Read(./.env)", "Bash(git push *)"]
  }
}
```

A rule with no `*` names one exact thing. `Bash(npm run test)` allows that one command.
`Read(./.env)` blocks reading that one file.

A `*` is a **wildcard** that matches anything in that spot. `Bash(npm run *)` allows any
`npm run` command. `Bash(git push *)` blocks any `git push`.

## Set your own rules

Now you'll teach Claude two rules of your own:

- **Allow** one command, so Claude runs it without asking: `touch rules-demo.txt`.
- **Deny** one file, so Claude can never read it: `secret.txt`.

Rules live in a settings file. You'll use `.claude/settings.local.json` in the sandbox. It
is separate from `settings.json`, so the lesson hooks are not affected.

Stay in manual mode for these steps:

1. **Create the file to protect.** Claude asks before writing it. Approve.

   ```prompt
   2
   ```
2. **Write the rules yourself.** In your editor, create the file
   `sandbox/.claude/settings.local.json` and start from this:

   ```json
   {
     "permissions": {
       "allow": [],
       "deny": []
     }
   }
   ```

   Add the two rules from the list above, one inside each array. Rules are written as
   `Tool(thing)`. Save the file.

   ```spoiler
   {
     "permissions": {
       "allow": ["Bash(touch rules-demo.txt)"],
       "deny": ["Read(./secret.txt)"]
     }
   }
   ```
3. **Test the rules.** Send this prompt:

   ```prompt
   3
   ```

   Two things should happen:
   - `touch rules-demo.txt` runs with no dialog, because you allowed it.
   - Reading `secret.txt` is refused, because you denied it.

If Claude still asks about `touch`, type `/exit`, run `claude` again, and resend the
last prompt. Claude may try another way to open `secret.txt`, such as a shell command.
That has its own dialog, and you can decline it.

## What to notice

- The mode is always shown in the bar at the bottom of the terminal.
- No feed row in plan mode is correct. The feed only shows tools that actually ran, so
  a denied or planned action never appears.
- The feed updates after you approve a dialog, not before.
- If a row is missing, check the terminal for a waiting permission dialog, make sure the
  dev server is running, and confirm you accepted the trust prompt.
- The `touch` command shows a Bash row in the feed. The refused read shows nothing.
