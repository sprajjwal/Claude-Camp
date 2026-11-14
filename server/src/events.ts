import type { Response } from "express";

export interface HookEvent {
  id: number;
  receivedAt: number;
  hook_event_name?: string;
  session_id?: string;
  [key: string]: unknown;
}

const MAX_EVENTS = 500;
const buffer: HookEvent[] = [];
const clients = new Set<Response>();
let nextId = 1;

export function addEvent(payload: Record<string, unknown>): HookEvent {
  const event: HookEvent = { ...payload, id: nextId++, receivedAt: Date.now() };
  buffer.push(event);
  if (buffer.length > MAX_EVENTS) buffer.shift();
  for (const res of clients) res.write(`data: ${JSON.stringify(event)}\n\n`);
  return event;
}

export function eventsSince(since: number): HookEvent[] {
  return buffer.filter((e) => e.receivedAt >= since);
}

export function snapshot(): HookEvent[] {
  return [...buffer];
}

export function clearEvents(): void {
  buffer.length = 0;
}

export function addClient(res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(": connected\n\n");
  clients.add(res);
  res.on("close", () => clients.delete(res));
}
