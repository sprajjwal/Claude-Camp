---
description: Manually run the test-engineer sub-agent on the latest changes (or a feature you name)
argument-hint: [feature description]
---

Invoke the `test-engineer` sub-agent with the Agent tool. Tell it to test: $ARGUMENTS
(if that is empty, tell it to run `git status` and `git diff` to find what changed).
When it returns `RESULT: FAIL`, show me the FIXES NEEDED list and ask before applying them.
