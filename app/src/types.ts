export interface LessonMeta {
  id: string;
  title: string;
  track: string;
  summary: string;
}

export interface Lesson extends LessonMeta {
  prompts: string[];
  preview?: string;
  body: string;
}

export interface HookEvent {
  id: number;
  receivedAt: number;
  hook_event_name?: string;
  prompt?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  last_assistant_message?: string;
  permission_mode?: string;
  [key: string]: unknown;
}

export interface CheckResult {
  label: string;
  passed: boolean;
}
