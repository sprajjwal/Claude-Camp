import path from "node:path";
import { fileURLToPath } from "node:url";

// server/src -> repo root. Works the same on any Linux-based environment.
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const LESSONS_DIR = path.join(ROOT, "lessons");
export const SANDBOX_DIR = path.join(ROOT, "sandbox");
export const PROGRESS_FILE = path.join(ROOT, "server", "progress.json");
