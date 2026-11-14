import fs from "node:fs";
import path from "node:path";
import type { Check } from "./lessons.js";
import { eventsSince } from "./events.js";
import { SANDBOX_DIR } from "./paths.js";

export interface CheckResult {
  label: string;
  passed: boolean;
}

function describe(c: Check): string {
  if (c.label) return c.label;
  switch (c.type) {
    case "fileExists": return `File ${c.path} exists in the sandbox`;
    case "toolUsed": return `Claude used the ${c.tool} tool`;
    case "promptCount": return `You sent at least ${c.min} prompt(s)`;
    case "eventSeen": return `Saw a ${c.event} event`;
  }
}

export function runChecks(checks: Check[], since: number): CheckResult[] {
  const events = eventsSince(since);
  return checks.map((c) => {
    let passed = false;
    switch (c.type) {
      case "fileExists": {
        const target = path.resolve(SANDBOX_DIR, c.path);
        // stay inside the sandbox even if a lesson file is malformed
        passed = target.startsWith(SANDBOX_DIR + path.sep) && fs.existsSync(target);
        break;
      }
      case "toolUsed":
        passed = events.some((e) => e.hook_event_name === "PostToolUse" && e.tool_name === c.tool);
        break;
      case "promptCount":
        passed = events.filter((e) => e.hook_event_name === "UserPromptSubmit").length >= c.min;
        break;
      case "eventSeen":
        passed = events.some((e) => e.hook_event_name === c.event);
        break;
    }
    return { label: describe(c), passed };
  });
}
